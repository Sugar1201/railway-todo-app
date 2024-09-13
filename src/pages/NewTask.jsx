import React, { useState, useEffect } from "react";
import { useCookies } from "react-cookie";
import axios from "axios";
import { url } from "../const";
import { Header } from "../components/Header";
import "./newTask.scss"
import { useNavigate } from "react-router-dom";

export const NewTask = () => {
  const [selectListId, setSelectListId] = useState();
  const [lists, setLists] = useState([]);
  const [title, setTitle] = useState("");
  const [detail, setDetail] = useState("");
  const [deadline, setDeadline] = useState(""); // Added deadline state
  const [errorMessage, setErrorMessage] = useState("");
  const [cookies] = useCookies();
  const history = useNavigate();

  const handleTitleChange = (e) => setTitle(e.target.value);
  const handleDetailChange = (e) => setDetail(e.target.value);
  const handleDeadlineChange = (e) => setDeadline(e.target.value); // Deadline change handler
  const handleSelectList = (id) => setSelectListId(id);

  // Convert the deadline from `YYYY-MM-DDTHH:MM` to `YYYY-MM-DDTHH:MM:SSZ`
  const formatDeadlineForServer = (deadline) => {
    if (!deadline) return null;
    return `${deadline}:00Z`; // Add seconds and Z for UTC
  };

  const onCreateTask = () => {
    const data = {
      title: title,
      detail: detail,
      done: false,
      limit: formatDeadlineForServer(deadline), // Send deadline in the correct format
    };

    axios.post(`${url}/lists/${selectListId}/tasks`, data, {
        headers: {
          authorization: `Bearer ${cookies.token}`
        }
    })
    .then(() => {
      history("/");
    })
    .catch((err) => {
      setErrorMessage(`タスクの作成に失敗しました。${err}`);
    })
  }

  useEffect(() => {
    axios.get(`${url}/lists`, {
      headers: {
        authorization: `Bearer ${cookies.token}`
      }
    })
    .then((res) => {
      setLists(res.data)
      setSelectListId(res.data[0]?.id)
    })
    .catch((err) => {
      setErrorMessage(`リストの取得に失敗しました。${err}`);
    })
  }, [])

  return (
    <div>
      <Header />
      <main className="new-task">
        <h2>タスク新規作成</h2>
        <p className="error-message">{errorMessage}</p>
        <form className="new-task-form">
          <label>リスト</label><br />
          <select onChange={(e) => handleSelectList(e.target.value)} className="new-task-select-list">
            {lists.map((list, key) => (
              <option key={key} className="list-item" value={list.id}>{list.title}</option>
            ))}
          </select><br />
          <label>タイトル</label><br />
          <input type="text" onChange={handleTitleChange} className="new-task-title" /><br />
          <label>詳細</label><br />
          <textarea type="text" onChange={handleDetailChange} className="new-task-detail" /><br />
          <label>期限日時</label><br />
          <input type="datetime-local" onChange={handleDeadlineChange} className="new-task-deadline" /><br />
          <button type="button" className="new-task-button" onClick={onCreateTask}>作成</button>
        </form>
      </main>
    </div>
  )
}