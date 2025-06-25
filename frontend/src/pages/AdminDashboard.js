import React, { useEffect, useState } from "react";
import API from "../api/axios";

function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    due_date: "",
    priority: "Low",
  });
  const [editTask, setEditTask] = useState(null);
  const [filters, setFilters] = useState({ search: "", priority: "", status: "" });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    fetchUsers();
    fetchAllTasks();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await API.get("/users", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setUsers(res.data);
    } catch (err) {
      console.error("Failed to fetch users:", err);
    }
  };

  const fetchAllTasks = async () => {
    try {
      const res = await API.get("/tasks", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setTasks(res.data || []);
    } catch (err) {
      console.error("Failed to fetch tasks:", err);
    }
  };

  const approveUser = async (id, role) => {
    try {
      await API.put(`/auth/approve/${id}`, { role }, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      fetchUsers();
    } catch (err) {
      console.error("Failed to approve user");
    }
  };

  const handleSelectUser = (userId) => {
    setSelectedUserId(userId);
    const selectedUser = users.find((u) => u.id === userId);
    setTaskForm({
      title: `Task for ${selectedUser?.username || "User"}`,
      description: "",
      due_date: "",
      priority: "Low",
    });
    setShowCreateModal(true);
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      await API.delete(`/tasks/users/${userId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      fetchUsers();
      alert("✅ User deleted");
    } catch (err) {
      console.error("Failed to delete user:", err);
    }
  };

  const handleTaskChange = (e) => {
    setTaskForm({ ...taskForm, [e.target.name]: e.target.value });
  };

  const handleCreateTask = async () => {
    try {
      await API.post("/tasks", { ...taskForm, assigned_to_id: selectedUserId }, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setShowCreateModal(false);
      fetchAllTasks();
    } catch (err) {
      console.error("Task creation failed:", err);
    }
  };

  const handleEditTask = (task) => {
    setEditTask(task);
    setShowEditModal(true);
  };

  const handleEditChange = (e) => {
    setEditTask({ ...editTask, [e.target.name]: e.target.value });
  };

  const handleSaveTask = async () => {
    try {
      await API.put(`/tasks/${editTask.id}`, editTask, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setShowEditModal(false);
      fetchAllTasks();
    } catch (err) {
      console.error("Failed to update task:", err);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm("Are you sure you want to delete this task?")) return;
    try {
      await API.delete(`/tasks/${taskId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      fetchAllTasks();
    } catch (err) {
      console.error("Failed to delete task:", err);
    }
  };

  const handleStatusUpdate = async (taskId, newStatus) => {
    try {
      await API.put(`/tasks/${taskId}`, { status: newStatus }, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      fetchAllTasks();
    } catch (err) {
      console.error("Status update failed:", err);
    }
  };

  const filteredTasks = tasks.filter((task) => {
    const search = filters.search.toLowerCase();
    return (
      (task.title?.toLowerCase().includes(search) || task.description?.toLowerCase().includes(search)) &&
      (!filters.priority || task.priority === filters.priority) &&
      (!filters.status || task.status === filters.status)
    );
  });

  const modalStyle = {
    position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
    background: "#ffffff", padding: "25px", borderRadius: "12px", width: "90%", maxWidth: "400px",
    boxShadow: "0 12px 24px rgba(0,0,0,0.2)", zIndex: 9999,
  };

  const overlayStyle = {
    position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "rgba(0,0,0,0.4)", zIndex: 9998,
  };

  const inputStyle = {
    width: "100%", padding: "10px", margin: "6px 0", border: "1px solid #ccc", borderRadius: "6px",
  };

  const buttonStyle = {
    backgroundColor: "#2563eb", color: "#fff", padding: "10px 16px",
    border: "none", borderRadius: "6px", cursor: "pointer", marginRight: "10px"
  };

  const dangerButton = { ...buttonStyle, backgroundColor: "#e11d48" };

  return (
    <div style={{ padding: "30px", background: "#f0f4f8", minHeight: "100vh", fontFamily: "Segoe UI" }}>
      <h2 style={{ fontSize: "32px", color: "#1e3a8a", textAlign: "center", marginBottom: "25px" }}>Admin Dashboard</h2>

      <div>
        <h3 style={{ color: "#1e40af" }}>Users</h3>
        {users.map((user) => (
          <div key={user.id} style={{ background: "#fff", padding: "15px", margin: "12px 0", borderRadius: "10px" }}>
            <strong>{user.username}</strong> ({user.role}) - {user.is_approved ? "✅ Approved" : "⏳ Pending"}
            <div style={{ marginTop: "10px" }}>
              {!user.is_approved && (
                <select onChange={(e) => approveUser(user.id, e.target.value)} style={inputStyle}>
                  <option>Select Role</option>
                  <option value="Admin">Admin</option>
                  <option value="User">User</option>
                </select>
              )}
              <button onClick={() => handleSelectUser(user.id)} style={buttonStyle}>Create Tasks</button>
              <button onClick={() => handleDeleteUser(user.id)} style={dangerButton}>Delete</button>
            </div>
          </div>
        ))}
      </div>

      <div>
        <h3 style={{ color: "#1e40af" }}>Task Filters</h3>
        <input style={inputStyle} placeholder="Search" value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} />
        <select style={inputStyle} value={filters.priority} onChange={(e) => setFilters({ ...filters, priority: e.target.value })}>
          <option value="">All Priority</option>
          <option>Low</option>
          <option>Medium</option>
          <option>High</option>
        </select>
        <select style={inputStyle} value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
          <option value="">All Status</option>
          <option>Pending</option>
          <option>In Progress</option>
          <option>Completed</option>
        </select>
      </div>

      <div>
        <h3 style={{ color: "#1e40af" }}>Tasks</h3>
        <table cellPadding="10" style={{ width: "100%", background: "#fff", borderCollapse: "collapse", marginTop: "10px" }}>
          <thead style={{ background: "#dbeafe" }}>
            <tr>
              <th>Title</th>
              <th>Priority</th>
              <th>Due</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredTasks.map((task) => (
              <tr key={task.id} style={{ borderBottom: "1px solid #e5e7eb" }}>
                <td>{task.title}</td>
                <td>{task.priority}</td>
                <td>{task.due_date}</td>
                <td>
                  <select style={inputStyle} value={task.status} onChange={(e) => handleStatusUpdate(task.id, e.target.value)}>
                    <option>Pending</option>
                    <option>In Progress</option>
                    <option>Completed</option>
                  </select>
                </td>
                <td>
                  <button onClick={() => handleEditTask(task)} style={buttonStyle}>Edit</button>
                  <button onClick={() => handleDeleteTask(task.id)} style={dangerButton}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {showCreateModal && (
        <>
          <div style={overlayStyle} onClick={() => setShowCreateModal(false)} />
          <div style={modalStyle}>
            <h3 style={{ marginBottom: "15px" }}>Create Task</h3>
            <input name="title" placeholder="Title" value={taskForm.title} onChange={handleTaskChange} style={inputStyle} />
            <input name="description" placeholder="Description" value={taskForm.description} onChange={handleTaskChange} style={inputStyle} />
            <input type="date" name="due_date" value={taskForm.due_date} onChange={handleTaskChange} style={inputStyle} />
            <select name="priority" value={taskForm.priority} onChange={handleTaskChange} style={inputStyle}>
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
            </select>
            <div style={{ marginTop: "15px" }}>
              <button onClick={handleCreateTask} style={buttonStyle}>Create</button>
              <button onClick={() => setShowCreateModal(false)} style={dangerButton}>Cancel</button>
            </div>
          </div>
        </>
      )}
      {showEditModal && (
        <>
          <div style={overlayStyle} onClick={() => setShowEditModal(false)} />
          <div style={modalStyle}>
            <h3 style={{ marginBottom: "15px" }}>Edit Task</h3>
            <input name="title" value={editTask.title} onChange={handleEditChange} style={inputStyle} />
            <input name="description" value={editTask.description} onChange={handleEditChange} style={inputStyle} />
            <input type="date" name="due_date" value={editTask.due_date} onChange={handleEditChange} style={inputStyle} />
            <select name="priority" value={editTask.priority} onChange={handleEditChange} style={inputStyle}>
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
            </select>
            <div style={{ marginTop: "15px" }}>
              <button onClick={handleSaveTask} style={buttonStyle}>Save</button>
              <button onClick={() => setShowEditModal(false)} style={dangerButton}>Cancel</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default AdminDashboard;
