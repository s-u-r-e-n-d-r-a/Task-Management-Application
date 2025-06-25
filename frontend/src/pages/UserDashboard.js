import React, { useEffect, useState, useCallback } from "react";
import API from "../api/axios";

function UserDashboard() {
  const [user, setUser] = useState(null);
  const [myTasks, setMyTasks] = useState([]);
  const [otherTasks, setOtherTasks] = useState([]);
  const [showMyTasks, setShowMyTasks] = useState(true);
  const [showOtherTasks, setShowOtherTasks] = useState(true);
  const [form, setForm] = useState({
    title: "",
    description: "",
    due_date: "",
    priority: "Low",
    status: "Pending",
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await API.get("/users/me", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setUser(res.data);
    } catch (err) {
      console.error("Failed to fetch user profile:", err);
    }
  };

  const fetchTasks = useCallback(async () => {
    if (!user) return;
    try {
      const res = await API.get("/tasks", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });

      const allTasks = res.data;

      const myTasksFiltered = allTasks.filter(
        (task) =>
          task.assigned_to_id === user.id || task.created_by_id === user.id
      );

      const othersTasksFiltered = allTasks.filter(
        (task) =>
          task.created_by?.role === "Admin" && task.assigned_to_id !== user.id
      );

      setMyTasks(myTasksFiltered);
      setOtherTasks(othersTasksFiltered);
    } catch (err) {
      console.error("Failed to fetch tasks:", err);
    }
  }, [user]);

  useEffect(() => {
    if (user) fetchTasks();
  }, [user, fetchTasks]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await API.post(
        "/tasks",
        { ...form, assigned_to_id: user.id },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );

      setForm({
        title: "",
        description: "",
        due_date: "",
        priority: "Low",
        status: "Pending",
      });

      fetchTasks();
    } catch (err) {
      console.error("Task creation failed:", err.response?.data || err.message);
      alert("Task creation failed.");
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await API.put(
        `/tasks/${taskId}`,
        { status: newStatus },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      fetchTasks();
    } catch (err) {
      console.error("Status update failed:", err.response?.data || err.message);
    }
  };

  const containerStyle = {
    minHeight: "100vh",
    padding: "30px",
    fontFamily: "Segoe UI, sans-serif",
    background: "linear-gradient(to right, #e0f7fa, #fce4ec)",
  };

  const gridStyle = {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "30px",
    alignItems: "start",
  };

  const cardStyle = {
    background: "#ffffff",
    padding: "20px",
    borderRadius: "12px",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
  };

  const taskItemStyle = {
    background: "#f9f9f9",
    padding: "15px",
    marginBottom: "15px",
    borderRadius: "8px",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
  };

  const toggleButtonStyle = {
    marginBottom: "10px",
    padding: "8px 14px",
    backgroundColor: "#1d4ed8",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "bold",
  };

  return (
    <div style={containerStyle}>
      <h2 style={{ marginBottom: "30px" }}>User Dashboard</h2>

      {user?.is_approved ? (
        <form
          onSubmit={handleSubmit}
          style={{
            ...cardStyle,
            marginBottom: "30px",
            display: "grid",
            gap: "15px",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            maxWidth: "1000px",
          }}
        >
          <input
            name="title"
            value={form.title}
            onChange={handleChange}
            placeholder="Title"
            required
          />
          <input
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="Description"
            required
          />
          <input
            type="date"
            name="due_date"
            value={form.due_date}
            onChange={handleChange}
            required
          />
          <select name="priority" value={form.priority} onChange={handleChange}>
            <option>Low</option>
            <option>Medium</option>
            <option>High</option>
          </select>
          <select name="status" value={form.status} onChange={handleChange}>
            <option>Pending</option>
            <option>In Progress</option>
            <option>Completed</option>
          </select>
          <button
            type="submit"
            style={{
              gridColumn: "span 2",
              backgroundColor: "#4caf50",
              color: "white",
              padding: "10px",
              border: "none",
              borderRadius: "8px",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            Create Task
          </button>
        </form>
      ) : (
        <p style={{ color: "red", fontWeight: "bold" }}>
          You are not approved by Admin. Please wait for approval.
        </p>
      )}

      <div style={gridStyle}>
        <div style={cardStyle}>
          <button onClick={() => setShowMyTasks(!showMyTasks)} style={toggleButtonStyle}>
            {showMyTasks ? "Hide My Tasks" : "Show My Tasks"}
          </button>
          {showMyTasks && (
            <>
              <h3>My Tasks</h3>
              {myTasks.map((task) => (
                <div key={task.id} style={taskItemStyle}>
                  <h4>{task.title}</h4>
                  <p>
                    <strong>Status:</strong>{" "}
                    <select
                      value={task.status}
                      onChange={(e) => handleStatusChange(task.id, e.target.value)}
                    >
                      <option>Pending</option>
                      <option>In Progress</option>
                      <option>Completed</option>
                    </select>
                  </p>
                  <p><strong>Due:</strong> {task.due_date}</p>
                  <p>{task.description}</p>
                  <p><strong>Priority:</strong> {task.priority}</p>
                  <p><strong>Assigned To:</strong> {task.assigned_to?.username}</p>
                  <p><strong>Created By:</strong> {task.created_by?.username}</p>
                </div>
              ))}
            </>
          )}
        </div>

        <div style={cardStyle}>
          <button onClick={() => setShowOtherTasks(!showOtherTasks)} style={toggleButtonStyle}>
            {showOtherTasks ? "Hide Admin Tasks" : "Show Admin Tasks"}
          </button>
          {showOtherTasks && (
            <>
              <h3>Admin Created Tasks for Others</h3>
              {otherTasks.map((task) => (
                <div key={task.id} style={taskItemStyle}>
                  <h4>{task.title}</h4>
                  <p><strong>Status:</strong> {task.status}</p>
                  <p><strong>Due:</strong> {task.due_date}</p>
                  <p>{task.description}</p>
                  <p><strong>Priority:</strong> {task.priority}</p>
                  <p><strong>Assigned To:</strong> {task.assigned_to?.username}</p>
                  <p><strong>Created By:</strong> {task.created_by?.username}</p>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default UserDashboard;
