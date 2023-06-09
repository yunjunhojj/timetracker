import React, { useState, useEffect } from "react";
import styled from "styled-components";
import ThumbUpAltIcon from "@mui/icons-material/ThumbUpAlt";
// firebase
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "../firebase";

const PomodoroTimerPage = () => {
  const [timeLeft, setTimeLeft] = useState(1500);
  const [isActive, setIsActive] = useState(false);
  const [isResting, setIsResting] = useState(false);
  const [pomodoroCounter, setPomodoroCounter] = useState([]);

  const [focusTime, setFocusTime] = useState(1500);
  const [restTime, setRestTime] = useState(300);

  const todaysDate = new Date().toISOString().slice(0, 10);

  const toggle = () => {
    setIsActive(!isActive);
  };

  const reset = () => {
    setTimeLeft(focusTime);
    setIsActive(false);
    setIsResting(false);
  };

  const breakTime = () => {
    setTimeLeft(restTime);
    setIsActive(false);
    setIsResting(true);
  };

  useEffect(() => {
    let interval = null;
    if (isActive) {
      interval = setInterval(() => {
        if (timeLeft > 0) {
          // pomodoro session is not over
          setTimeLeft((prevTime) => prevTime - 1);
        } else if (!isResting) {
          // pomodoro session is over
          setIsResting(true);
          setTimeLeft(restTime);
          setPomodoroCounter((prevPomodoroCounter) => [
            ...prevPomodoroCounter,
            focusTime,
          ]);
          savePomodoroCounterToFirebase();
        } else {
          // rest time is over
          setIsResting(false);
          setTimeLeft(focusTime);
        }
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [focusTime, isActive, isResting, restTime, timeLeft]);

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    return `${minutes < 10 ? "0" + minutes : minutes}:${
      seconds < 10 ? "0" + seconds : seconds
    }`;
  };

  const savePomodoroCounterToFirebase = () => {
    const auth = getAuth();
    const user = auth.currentUser;
    const docRef = doc(db, user.email + "-pomodoro", todaysDate);
    setDoc(docRef, { pomodoroCounter: [...pomodoroCounter, focusTime] });
  };

  const getPomodoroCounterFromFirebase = async () => {
    const auth = getAuth();
    const user = auth.currentUser;
    const docRef = doc(db, user.email + "-pomodoro", todaysDate);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      setPomodoroCounter(docSnap.data().pomodoroCounter);
    }
  };

  useEffect(() => {
    const auth = getAuth();
    onAuthStateChanged(auth, (user) => {
      if (user) {
        getPomodoroCounterFromFirebase();
      }
    });
  }, []);

  return (
    <Wrapper>
      <h1>Pomodoro Timer</h1>
      <div>I have completed {pomodoroCounter.length} Pomodoro sessions </div>
      <PomodoroCounterContainer>
        {pomodoroCounter.map((pomodoro, index) => {
          return <ThumbUpAltIcon key={index} style={{ color: "red" }} />;
        })}
      </PomodoroCounterContainer>
      <SettingWrapper>
        <label>
          <input
            type="number"
            value={focusTime / 60}
            min={1}
            onChange={(e) => setFocusTime(e.target.value * 60)}
          />
          <span>Set focus time</span>
        </label>
        <label>
          <input
            type="number"
            value={restTime / 60}
            min={1}
            onChange={(e) => setRestTime(e.target.value * 60)}
          />
          <span>Set break time</span>
        </label>
      </SettingWrapper>
      <Timer>
        <span>{isResting ? "Rest Time" : "Focus Time"}</span>
        {formatTime(timeLeft)}
      </Timer>
      <ButtonWrapper>
        {isActive ? (
          <Button onClick={toggle}>Pause</Button>
        ) : (
          <Button onClick={toggle}>Start</Button>
        )}
        <Button onClick={reset}>focus</Button>
        <Button onClick={breakTime}>break</Button>
      </ButtonWrapper>
      <PomodoroInfo>
        <p>
          <strong>Focus</strong> for 25 minutes, then take a{" "}
          <strong>5 minute break</strong>.
        </p>
        <p>
          After four <strong>focus</strong> sessions, take a longer{" "}
          <strong>15 minute break</strong>.
        </p>
      </PomodoroInfo>
    </Wrapper>
  );
};

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  margin-top: 12px;
`;

const PomodoroCounterContainer = styled.div`
  display: flex;
  flex-direction: row;
  gap: 1rem;

  margin-top: 1rem;
`;

const SettingWrapper = styled.div`
  display: flex;
  flex-direction: row;
  gap: 2rem;
  margin: 2rem;

  label {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  input {
    width: 100px;
    padding: 0.5rem;
    border-radius: 0.5rem;
    border: none;
    background-color: #4d4d4d;
    color: #fff;
    cursor: pointer;

    text-align: center;

    &:hover {
      background-color: #006ba1;
    }
  }
`;

const Timer = styled.div`
  font-size: 5rem;
  font-weight: bold;
  margin: 2rem;

  span {
    display: block;
    font-size: 1.5rem;
    font-weight: normal;
  }
`;

const ButtonWrapper = styled.div`
  display: flex;
  flex-direction: row;
  gap: 1rem;
`;

const Button = styled.button`
  font-size: 1.5rem;
  padding: 1rem 2rem;
  border-radius: 0.5rem;
  border: none;
  background-color: #0077c2;
  color: #fff;
  cursor: pointer;

  &:hover {
    background-color: #006ba1;
  }
`;

const PomodoroInfo = styled.div`
  margin-top: 2rem;
  text-align: center;
`;

export default PomodoroTimerPage;
