import { useState, useEffect, useRef } from "react";
import {
  ClockCircleOutlined,
  CoffeeOutlined,
  SkinOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  ReloadOutlined,
  BarChartOutlined,
  CheckCircleOutlined,
  TrophyOutlined,
  ClearOutlined,
} from "@ant-design/icons";

const Pomodoro = () => {
  const [minutes, setMinutes] = useState(25);
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [totalToday, setTotalToday] = useState(0);
  const [sessionCount, setSessionCount] = useState(0);
  const [mode, setMode] = useState("pomodoro");
  const [notification, setNotification] = useState(null);

  const timerRef = useRef(null);
  const audioRef = useRef(null);

  const modes = {
    pomodoro: { time: minutes, label: "专注时间", color: "#e74c3c" },
    shortBreak: { time: 5, label: "短时休息", color: "#3498db" },
    longBreak: { time: 15, label: "长时休息", color: "#2ecc71" },
  };

  useEffect(() => {
    const savedStats = localStorage.getItem("pomodoro_stats");
    const savedSessions = localStorage.getItem("pomodoro_sessions");
    if (savedStats) setTotalToday(parseInt(savedStats));
    if (savedSessions) setSessionCount(parseInt(savedSessions));
  }, []);

  useEffect(() => {
    if (isActive && secondsLeft > 0) {
      timerRef.current = setInterval(() => {
        setSecondsLeft((prev) => prev - 1);
      }, 1000);
    } else if (secondsLeft === 0) {
      handleComplete();
    }

    return () => clearInterval(timerRef.current);
  }, [isActive, secondsLeft]);

  const showNotification = (message, type = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
    if (audioRef.current) audioRef.current.play();
  };

  const handleComplete = () => {
    clearInterval(timerRef.current);
    setIsActive(false);

    if (mode === "pomodoro") {
      const newTotal = totalToday + minutes;
      const newSessions = sessionCount + 1;
      setTotalToday(newTotal);
      setSessionCount(newSessions);
      localStorage.setItem("pomodoro_stats", newTotal);
      localStorage.setItem("pomodoro_sessions", newSessions);

      showNotification(`完成了 ${minutes} 分钟专注！`);

      if (window.confirm("专注完成！是否开始休息？")) {
        if (newSessions % 4 === 0) {
          switchMode("longBreak");
        } else {
          switchMode("shortBreak");
        }
      }
    } else {
      showNotification("休息结束！准备开始新的专注！", "info");
      switchMode("pomodoro");
    }
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    setIsActive(false);
    const time = newMode === "pomodoro" ? minutes : modes[newMode].time;
    setSecondsLeft(time * 60);
    clearInterval(timerRef.current);
  };

  const toggleTimer = () => setIsActive(!isActive);

  const resetTimer = () => {
    setIsActive(false);
    const time = mode === "pomodoro" ? minutes : modes[mode].time;
    setSecondsLeft(time * 60);
    clearInterval(timerRef.current);
  };

  const handleTimeChange = (e) => {
    let val = parseInt(e.target.value) || 1;
    if (val < 1) val = 1;
    if (val > 60) val = 60;
    setMinutes(val);
    if (mode === "pomodoro") setSecondsLeft(val * 60);
  };

  const formatTime = () => {
    const mins = Math.floor(secondsLeft / 60);
    const secs = secondsLeft % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const getProgress = () => {
    const total = mode === "pomodoro" ? minutes * 60 : modes[mode].time * 60;
    return ((total - secondsLeft) / total) * 100;
  };

  const clearStats = () => {
    if (window.confirm("确定要清除所有记录吗？")) {
      localStorage.setItem("pomodoro_stats", 0);
      localStorage.setItem("pomodoro_sessions", 0);
      setTotalToday(0);
      setSessionCount(0);
      showNotification("记录已清除", "info");
    }
  };

  return (
    <div className="pomodoro-app">
      <audio ref={audioRef} src="/notification.mp3" preload="auto" />

      {notification && (
        <div className={`notification notification-${notification.type}`}>
          {notification.message}
        </div>
      )}

      <div className="pomodoro-card">
        <h1>
          <ClockCircleOutlined style={{ marginRight: 8 }} />
          专注计时器
        </h1>

        <div className="mode-tabs">
          <button
            className={`mode-btn ${mode === "pomodoro" ? "active" : ""}`}
            onClick={() => switchMode("pomodoro")}
          >
            <ClockCircleOutlined /> 专注
          </button>
          <button
            className={`mode-btn ${mode === "shortBreak" ? "active" : ""}`}
            onClick={() => switchMode("shortBreak")}
          >
            <CoffeeOutlined /> 短时休息
          </button>
          <button
            className={`mode-btn ${mode === "longBreak" ? "active" : ""}`}
            onClick={() => switchMode("longBreak")}
          >
            <SkinOutlined /> 长时休息
          </button>
        </div>

        <div className="timer-wrapper">
          <div className="timer-circle">
            <div
              className="timer-progress"
              style={{
                strokeDashoffset: 565 - (getProgress() * 565) / 100,
              }}
            />
            <div className="timer-display">
              <div className="timer-label">{modes[mode].label}</div>
              <div className="timer-time">{formatTime()}</div>
            </div>
          </div>
        </div>

        <div className="controls">
          <button className="control-btn play-btn" onClick={toggleTimer}>
            {isActive ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
            {isActive ? " 暂停" : " 开始"}
          </button>
          <button className="control-btn reset-btn" onClick={resetTimer}>
            <ReloadOutlined /> 重置
          </button>
        </div>

        {mode === "pomodoro" && (
          <div className="settings">
            <label>
              专注时长：
              <input
                type="range"
                value={minutes}
                onChange={handleTimeChange}
                disabled={isActive}
                min="1"
                max="60"
                step="1"
              />
              <span className="time-value">{minutes} 分钟</span>
            </label>
          </div>
        )}

        <div className="stats-panel">
          <div className="stat-card">
            <div className="stat-icon">
              <BarChartOutlined />
            </div>
            <div className="stat-info">
              <div className="stat-value">{totalToday}</div>
              <div className="stat-label">今日专注（分钟）</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              <CheckCircleOutlined />
            </div>
            <div className="stat-info">
              <div className="stat-value">{sessionCount}</div>
              <div className="stat-label">完成番茄数</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              <TrophyOutlined />
            </div>
            <div className="stat-info">
              <div className="stat-value">{Math.floor(totalToday / 25)}</div>
              <div className="stat-label">等效番茄数</div>
            </div>
          </div>
        </div>

        <button className="clear-btn" onClick={clearStats}>
          <ClearOutlined /> 清除记录
        </button>
      </div>
    </div>
  );
};

export default Pomodoro;
