import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useCookies } from "react-cookie";
import axios from "axios";
import { Header } from "../components/Header";
import { url } from "../const";
import dayjs from "dayjs"; // Import dayjs for date handling
import utc from 'dayjs/plugin/utc'; // Import UTC plugin for dayjs
import "./home.scss";

dayjs.extend(utc); // Extend dayjs with UTC plugin

export const Home = () => {
  const [isDoneDisplay, setIsDoneDisplay] = useState("todo"); // todo->未完了 done->完了
  const [lists, setLists] = useState([]);
  const [selectListId, setSelectListId] = useState();
  const [tasks, setTasks] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [cookies] = useCookies();
  const handleIsDoneDisplayChange = (e) => setIsDoneDisplay(e.target.value);
  useEffect(() => {
    axios.get(`${url}/lists`, {
      headers: {
        authorization: `Bearer ${cookies.token}`
      }
    })
    .then((res) => {
      setLists(res.data)
    })
    .catch((err) => {
      setErrorMessage(`リストの取得に失敗しました。${err}`); //day js, date-fns
    })
  }, []);

  useEffect(() => {
    const listId = lists[0]?.id
    if(typeof listId !== "undefined"){
      setSelectListId(listId)
      axios.get(`${url}/lists/${listId}/tasks`, {
        headers: {
          authorization: `Bearer ${cookies.token}`
        }
      })
      .then((res) => {
        setTasks(res.data.tasks)
      })
      .catch((err) => {
        setErrorMessage(`タスクの取得に失敗しました。${err}`);
      })
    }
  }, [lists]);

  const handleSelectList = (id) => {
    setSelectListId(id);
    axios.get(`${url}/lists/${id}/tasks`, {
      headers: {
        authorization: `Bearer ${cookies.token}`
      }
    })
    .then((res) => {
      setTasks(res.data.tasks)
    })
    .catch((err) => {
      setErrorMessage(`タスクの取得に失敗しました。${err}`);
    })
  }

  const handleKeyDown = (e, currentIndex) => {
    const tabs = document.querySelectorAll('[role="tab"]');
    
    if (e.key === 'ArrowRight') {
      const nextIndex = (currentIndex + 1) % tabs.length;
      tabs[nextIndex].focus();
    } else if (e.key === 'ArrowLeft') {
      const prevIndex = (currentIndex - 1 + tabs.length) % tabs.length;
      tabs[prevIndex].focus();
    } else if (e.key === 'Enter' || e.key === ' ') {
      tabs[currentIndex].click();
    }
  };  

  return (
    <div>
      <Header />
      <main className="taskList">
        <p className="error-message">{errorMessage}</p>
        <div>
          <div className="list-header">
            <h2>リスト一覧</h2>
            <div className="list-menu">
              <p><Link to="/list/new">リスト新規作成</Link></p>
              <p><Link to={`/lists/${selectListId}/edit`}>選択中のリストを編集</Link></p>
            </div>
          </div>
          <ul role="tablist" className="list-tab">
            {lists.map((list, key) => {
              const isActive = list.id === selectListId;
              return (
                <li
                  key={key}
                  className={`list-tab-item ${isActive ? "active" : ""}`}
                  role="tab"
                  tabIndex={isActive ? 0 : -1}
                  aria-selected={isActive ? "true" : "false"}
                  onClick={() => handleSelectList(list.id)}
                  onKeyDown={(e) => handleKeyDown(e, key)}
                >
                  {list.title}
                </li>
              );
            })}
          </ul>
          <div className="tasks">
            <div className="tasks-header">
              <h2>タスク一覧</h2>
              <Link to="/task/new">タスク新規作成</Link>
            </div>
            <div className="display-select-wrapper">
              <select onChange={handleIsDoneDisplayChange} className="display-select">
                <option value="todo">未完了</option>
                <option value="done">完了</option>
              </select>
            </div>
            <Tasks tasks={tasks} selectListId={selectListId} isDoneDisplay={isDoneDisplay} />
          </div>
        </div>
      </main>
    </div>
  )
}

// 表示するタスク
const Tasks = (props) => {
  const { tasks, selectListId, isDoneDisplay } = props;
  if (tasks === null) return <></>;

  // Helper to calculate the number of days left and format the deadline
  const getDaysLeft = (limit) => {
    const now = dayjs(); 
    console.log(now);
    const deadline = dayjs(limit.slice(0, 16)); // Zあるとutcに戻ってしまうのでsliceでZとる
    console.log(limit);
    console.log(deadline);
  
    if (deadline.isBefore(now)) {
      return "期限切れ"; 
    }
  
    // 残り時間を分単位で計算
    const totalMinutesLeft = deadline.diff(now, 'minute');
  
    // 日数、時間、分を計算
    const daysLeft = Math.floor(totalMinutesLeft / (60 * 24)); // 残り日数
    const hoursLeft = Math.floor((totalMinutesLeft % (60 * 24)) / 60); // 日数を除いた残り時間
    const minutesLeft = totalMinutesLeft % 60; // 残りの分
  
    // 結果に応じたメッセージを返す
    if (daysLeft > 0) {
      return `残り${daysLeft}日${hoursLeft}時間${minutesLeft}分`; // 日数がある場合
    } else if (hoursLeft > 0) {
      return `残り${hoursLeft}時間${minutesLeft}分`; // 時間がある場合
    } else if (minutesLeft > 0) {
      return `残り${minutesLeft}分`; // 分のみの場合
    } else {
      return "残り０分"; // 今が期限の場合
    }
  };  

  const formatDeadline = (limit) => {
    if (!limit) return "期限なし";
    return dayjs.utc(limit).format("YYYY-MM-DD HH:mm"); // Format to "YYYY-MM-DD HH:mm"
  };

  return (
    <ul>
      {tasks
        .filter((task) => (isDoneDisplay === "done" ? task.done : !task.done))
        .map((task, key) => (
          <li key={key} className="task-item">
            <Link to={`/lists/${selectListId}/tasks/${task.id}`} className="task-item-link">
              {task.title}<br />
              {task.done ? "完了" : "未完了"}<br />
              {/* Only show remaining days and deadline if the task is not completed */}
              {!task.done && task.limit ? (
                <div className="task-item-time">
                  期限: {formatDeadline(task.limit)}<br />
                  {getDaysLeft(task.limit)} {/* Show remaining days */}
                </div>
              ) : null}
            </Link>
          </li>
        ))}
    </ul>
  );
};