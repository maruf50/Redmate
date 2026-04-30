import { useEffect, useMemo, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import {
  createGroup,
  createNote,
  endSession,
  getGroups,
  getMatches,
  getMe,
  getStats,
  joinGroup,
  listGroupMessages,
  listGlobalMessages,
  listNotes,
  login,
  register,
  saveProfile,
  startSession
} from "./api";
import type { User } from "./api";
import { AuthPanel } from "./components/AuthPanel";
import { MainNav } from "./components/MainNav";
import { ChatView } from "./components/views/ChatView";
import { DashboardView } from "./components/views/DashboardView";
import { GroupsView } from "./components/views/GroupsView";
import { MatchingView } from "./components/views/MatchingView";
import { NotesView } from "./components/views/NotesView";
import { TrackerView } from "./components/views/TrackerView";
import { API_SOCKET_URL, NAV_ITEMS, STUDY_HOURS_GOAL, XP_GOAL } from "./constants";
import type { GroupSummary, MatchCandidate, Message, NoteSummary, View } from "./types";
import { buildInterestChart, filterMatchesByInterest, uniqueInterestTopics } from "./utils";


function App() {
  const [token, setToken] = useState<string>(localStorage.getItem("sgf-token") || "");
  const [user, setUser] = useState<User | null>(null);
  const [activeView, setActiveView] = useState<View>("dashboard");

  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [university, setUniversity] = useState("");
  const [department, setDepartment] = useState("");
  const [password, setPassword] = useState("");
  const [authStatus, setAuthStatus] = useState("");
  const [authError, setAuthError] = useState("");
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  const [interestInput, setInterestInput] = useState("math");
  const [universityInput, setUniversityInput] = useState("");
  const [departmentInput, setDepartmentInput] = useState("");

  const [groupName, setGroupName] = useState("Focused Algebra Team");
  const [groupTopic, setGroupTopic] = useState("math");
  const [groupDescription, setGroupDescription] = useState("Evening focused practice");

  const [matches, setMatches] = useState<MatchCandidate[]>([]);
  const [matchInterest, setMatchInterest] = useState("");
  const [selectedMatchUserIds, setSelectedMatchUserIds] = useState<string[]>([]);
  const [partyGroupName, setPartyGroupName] = useState("Ranked Study Party");
  const [demoCandidates, setDemoCandidates] = useState<MatchCandidate[]>([]);
  const [isDemoRunning, setIsDemoRunning] = useState(false);
  const [demoStatus, setDemoStatus] = useState("Select an interest, then start matchmaking demo.");

  const [groups, setGroups] = useState<GroupSummary[]>([]);
  const [notes, setNotes] = useState<NoteSummary[]>([]);

  const [globalMessages, setGlobalMessages] = useState<Message[]>([]);
  const [groupMessages, setGroupMessages] = useState<Message[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>("");
  const [chatInput, setChatInput] = useState("");
  const [groupChatInput, setGroupChatInput] = useState("");

  const [activeSessionId, setActiveSessionId] = useState<string>("");
  const [socket, setSocket] = useState<Socket | null>(null);
  const demoTimerRef = useRef<number | null>(null);

  const isLoggedIn = Boolean(token);

  useEffect(() => {
    if (!token) {
      localStorage.removeItem("sgf-token");
      return;
    }

    localStorage.setItem("sgf-token", token);

    const socketClient = io(API_SOCKET_URL, { auth: { token } });
    socketClient.on("chat:global:message", (message: Message) => {
      setGlobalMessages((prev) => [...prev.slice(-100), message]);
    });
    socketClient.on("chat:group:message", (message: Message) => {
      setGroupMessages((prev) => [...prev.slice(-100), message]);
    });
    setSocket(socketClient);

    return () => {
      socketClient.disconnect();
    };
  }, [token]);

  useEffect(() => {
    return () => {
      if (demoTimerRef.current !== null) {
        window.clearTimeout(demoTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!token) {
      return;
    }

    void refreshCoreData(token);
  }, [token]);

  async function refreshCoreData(currentToken: string): Promise<void> {
    const [me, matchesData, groupsData, statsData, notesData, globalChatData] = await Promise.all([
      getMe(currentToken),
      getMatches(currentToken),
      getGroups(currentToken),
      getStats(currentToken),
      listNotes(currentToken),
      listGlobalMessages(currentToken)
    ]);

    setUser((prev) => {
      const base = me.user || prev;
      if (!base) {
        return null;
      }
      return {
        ...base,
        totalStudyMinutes: statsData.totalStudyMinutes ?? base.totalStudyMinutes,
        totalXp: statsData.totalXp ?? base.totalXp
      };
    });

    setMatches(matchesData.matches || []);
    setGroups(groupsData.groups || []);
    setNotes(notesData.notes || []);
    setGlobalMessages(globalChatData.messages || []);
  }

  const statsText = useMemo(() => {
    if (!user) {
      return "No stats yet";
    }
    return `${Math.round(user.totalStudyMinutes / 60)}h total, ${user.totalXp} XP`;
  }, [user]);

  const studyHours = useMemo(() => {
    return user ? Number((user.totalStudyMinutes / 60).toFixed(1)) : 0;
  }, [user]);

  const xpProgress = useMemo(() => {
    if (!user) return 0;
    return Math.min(100, Math.round((user.totalXp / XP_GOAL) * 100));
  }, [user]);

  const hoursProgress = useMemo(() => {
    if (!user) return 0;
    return Math.min(100, Math.round((studyHours / STUDY_HOURS_GOAL) * 100));
  }, [studyHours, user]);

  const interestChart = useMemo(() => buildInterestChart(user), [user]);
  const availableInterests = useMemo(() => uniqueInterestTopics(user), [user]);
  const filteredMatches = useMemo(
    () => filterMatchesByInterest(matches, matchInterest),
    [matchInterest, matches]
  );

  useEffect(() => {
    setUniversityInput(user?.university || "");
    setDepartmentInput(user?.department || "");
  }, [user?.university, user?.department]);

  async function onRegister() {
    setIsAuthLoading(true);
    setAuthError("");
    setAuthStatus("Creating account...");
    try {
      const data = await register({ email, username, university, department, password });
      if (data.token) {
        setToken(data.token);
        setUser(data.user);
        setActiveView("dashboard");
        setAuthStatus("Account created. Logged in successfully.");
      }
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "Registration failed");
      setAuthStatus("");
    } finally {
      setIsAuthLoading(false);
    }
  }

  async function onLogin() {
    setIsAuthLoading(true);
    setAuthError("");
    setAuthStatus("Logging in...");
    try {
      const data = await login({ email, password });
      if (data.token) {
        setToken(data.token);
        setUser(data.user);
        setActiveView("dashboard");
        setAuthStatus("Logged in successfully.");
      }
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "Login failed");
      setAuthStatus("");
    } finally {
      setIsAuthLoading(false);
    }
  }

  async function onDemoLogin() {
    setIsAuthLoading(true);
    setAuthError("");
    setAuthStatus("Logging in with demo account...");
    try {
      const data = await login({
        email: "demo@studygroupfinder.app",
        password: "DemoPass123!"
      });

      if (data.token) {
        setEmail("demo@studygroupfinder.app");
        setUsername(data.user?.username || "Aisha");
        setPassword("DemoPass123!");
        setToken(data.token);
        setUser(data.user);
        setActiveView("dashboard");
        setAuthStatus("Demo login successful.");
      }
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "Demo login failed");
      setAuthStatus("");
    } finally {
      setIsAuthLoading(false);
    }
  }

  async function onSaveProfile() {
    if (!token) return;

    const data = await saveProfile(token, {
      university: universityInput,
      department: departmentInput,
      interests: [
        { topic: interestInput, level: "intermediate" },
        { topic: "physics", level: "beginner" }
      ],
      availability: [
        { day: "mon", startHour: 18, endHour: 21 },
        { day: "wed", startHour: 18, endHour: 21 }
      ]
    });

    setUser(data.user || null);
    const matchData = await getMatches(token);
    setMatches(matchData.matches || []);
  }

  async function onCreateGroup() {
    if (!token) return;

    await createGroup(token, {
      name: groupName,
      topic: groupTopic,
      description: groupDescription
    });

    const groupsData = await getGroups(token);
    setGroups(groupsData.groups || []);
  }

  async function onJoinGroup(groupId: string) {
    if (!token) return;

    await joinGroup(token, groupId);
    const groupsData = await getGroups(token);
    setGroups(groupsData.groups || []);
  }

  async function onOpenGroupChat(groupId: string) {
    if (!token || !socket) return;

    setSelectedGroupId(groupId);
    socket.emit("join:group", groupId);

    const chatData = await listGroupMessages(token, groupId);
    setGroupMessages(chatData.messages || []);
    setActiveView("chat");
  }

  async function onStartSession() {
    if (!token) return;
    const data = await startSession(token);
    setActiveSessionId(data.session?.id || "");
  }

  async function onEndSession() {
    if (!token || !activeSessionId) return;

    const data = await endSession(token, activeSessionId);
    setActiveSessionId("");
    setUser((prev) =>
      prev
        ? {
            ...prev,
            totalStudyMinutes: data.totals?.totalStudyMinutes ?? prev.totalStudyMinutes,
            totalXp: data.totals?.totalXp ?? prev.totalXp
          }
        : prev
    );
  }

  async function onAddNote() {
    if (!token) return;

    await createNote(token, {
      title: "Quick Revision",
      content: "Remember active recall and spaced repetition.",
      links: ["https://www.khanacademy.org"]
    });

    const notesData = await listNotes(token);
    setNotes(notesData.notes || []);
  }

  function onToggleMatchUser(userId: string) {
    setSelectedMatchUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  }

  function pickRandomCandidates(pool: MatchCandidate[], count: number): MatchCandidate[] {
    const copy = [...pool];
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const randomIndex = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[randomIndex]] = [copy[randomIndex], copy[i]];
    }
    return copy.slice(0, count);
  }

  function onStartMatchmakingDemo() {
    if (!matchInterest.trim()) {
      setDemoStatus("Choose an interest first so the demo can find same-interest users.");
      return;
    }

    if (filteredMatches.length === 0) {
      setDemoStatus("No users found for this interest yet. Try another interest.");
      setDemoCandidates([]);
      setSelectedMatchUserIds([]);
      return;
    }

    if (demoTimerRef.current !== null) {
      window.clearTimeout(demoTimerRef.current);
    }

    setIsDemoRunning(true);
    setDemoCandidates([]);
    setSelectedMatchUserIds([]);
    setDemoStatus(`Searching matchmaking queue for ${matchInterest}...`);

    demoTimerRef.current = window.setTimeout(() => {
      const count = Math.min(filteredMatches.length, Math.max(2, Math.floor(Math.random() * 4) + 1));
      const found = pickRandomCandidates(filteredMatches, count);
      setDemoCandidates(found);
      setSelectedMatchUserIds(found.map((item) => item.userId));
      setPartyGroupName(`${matchInterest} Session Squad`);
      setIsDemoRunning(false);
      setDemoStatus(`${found.length} users found. Create group to start session and open group chat.`);
    }, 1500);
  }

  async function onCreatePartyGroup() {
    if (!token) return;

    const topicFromMatch = matchInterest.trim() || groupTopic;
    const createResult = await createGroup(token, {
      name: partyGroupName,
      topic: topicFromMatch,
      description: `Auto-created study session group for ${topicFromMatch}.`,
      invitedUserIds: selectedMatchUserIds
    });

    const createdGroupId = createResult?.group?.id as string | undefined;
    if (createdGroupId) {
      const sessionData = await startSession(token, createdGroupId);
      setActiveSessionId(sessionData.session?.id || "");
      await onOpenGroupChat(createdGroupId);
    }

    setSelectedMatchUserIds([]);
    const groupsData = await getGroups(token);
    setGroups(groupsData.groups || []);
  }

  async function onCreateDemoGroup() {
    if (!token || demoCandidates.length === 0) {
      return;
    }

    const candidateIds = demoCandidates.map((item) => item.userId);
    const topicFromMatch = matchInterest.trim() || groupTopic;

    const createResult = await createGroup(token, {
      name: partyGroupName,
      topic: topicFromMatch,
      description: `Demo matchmaking group for ${topicFromMatch}.`,
      invitedUserIds: candidateIds
    });

    const createdGroupId = createResult?.group?.id as string | undefined;
    if (createdGroupId) {
      const sessionData = await startSession(token, createdGroupId);
      setActiveSessionId(sessionData.session?.id || "");
      await onOpenGroupChat(createdGroupId);
      setDemoStatus("Group created and session started. You are now in group chat.");
    }
  }

  function onSendGlobalChat() {
    if (!chatInput || !socket) return;
    socket.emit("chat:global", chatInput);
    setChatInput("");
  }

  function onSendGroupChat() {
    if (!groupChatInput || !socket || !selectedGroupId) return;
    socket.emit("chat:group", { groupId: selectedGroupId, content: groupChatInput });
    setGroupChatInput("");
  }

  function onLogout() {
    setToken("");
    setUser(null);
    setMatches([]);
    setGroups([]);
    setNotes([]);
    setGlobalMessages([]);
    setGroupMessages([]);
    setSelectedGroupId("");
    setSelectedMatchUserIds([]);
    setActiveView("dashboard");
  }

  return (
    <div className="page">
      {!isLoggedIn ? (
        <>
          <header className="hero">
            <h1>StudyGroupFinder</h1>
            <p>Connect with the right peers and keep your progress in one place.</p>
          </header>
          <AuthPanel
            email={email}
            username={username}
            university={university}
            department={department}
            password={password}
            authStatus={authStatus}
            authError={authError}
            isAuthLoading={isAuthLoading}
            onEmailChange={setEmail}
            onUsernameChange={setUsername}
            onUniversityChange={setUniversity}
            onDepartmentChange={setDepartment}
            onPasswordChange={setPassword}
            onRegister={onRegister}
            onLogin={onLogin}
            onDemoLogin={onDemoLogin}
          />
        </>
      ) : (
        <div className="app-shell">
          <MainNav
            navItems={NAV_ITEMS}
            activeView={activeView}
            onNavigate={setActiveView}
            onLogout={onLogout}
          />

          <section className="workspace">
            <header className="topbar">
              <div>
                <h2>{activeView[0].toUpperCase() + activeView.slice(1)}</h2>
                <p>
                  {user?.university || "University"} • {user?.department || "Department"}
                </p>
              </div>
              <div className="topbar-actions">
                <span className="top-chip">{user?.username || "Student"}</span>
                <span className="top-chip">{statsText}</span>
              </div>
            </header>

            <section className="kpi-strip">
              <article className="kpi-card">
                <h4>Total XP</h4>
                <strong>{user?.totalXp ?? 0}</strong>
              </article>
              <article className="kpi-card">
                <h4>Study Hours</h4>
                <strong>{studyHours}h</strong>
              </article>
              <article className="kpi-card">
                <h4>Active Groups</h4>
                <strong>{groups.length}</strong>
              </article>
              <article className="kpi-card">
                <h4>Match Pool</h4>
                <strong>{filteredMatches.length}</strong>
              </article>
            </section>

            {activeView === "dashboard" && (
              <DashboardView
                user={user}
                statsText={statsText}
                xpGoal={XP_GOAL}
                studyHoursGoal={STUDY_HOURS_GOAL}
                xpProgress={xpProgress}
                hoursProgress={hoursProgress}
                studyHours={studyHours}
                interestChart={interestChart}
                interestInput={interestInput}
                universityInput={universityInput}
                departmentInput={departmentInput}
                onInterestInputChange={setInterestInput}
                onUniversityInputChange={setUniversityInput}
                onDepartmentInputChange={setDepartmentInput}
                onSaveProfile={onSaveProfile}
              />
            )}

            {activeView === "matching" && (
              <MatchingView
                matchInterest={matchInterest}
                availableInterests={availableInterests}
                partyGroupName={partyGroupName}
                selectedMatchUserIds={selectedMatchUserIds}
                filteredMatches={filteredMatches}
                demoCandidates={demoCandidates}
                isDemoRunning={isDemoRunning}
                demoStatus={demoStatus}
                onMatchInterestChange={setMatchInterest}
                onPartyGroupNameChange={setPartyGroupName}
                onToggleMatchUser={onToggleMatchUser}
                onStartMatchmakingDemo={onStartMatchmakingDemo}
                onCreateDemoGroup={onCreateDemoGroup}
                onCreatePartyGroup={onCreatePartyGroup}
              />
            )}

            {activeView === "groups" && (
              <GroupsView
                groupName={groupName}
                groupTopic={groupTopic}
                groupDescription={groupDescription}
                groups={groups}
                onGroupNameChange={setGroupName}
                onGroupTopicChange={setGroupTopic}
                onGroupDescriptionChange={setGroupDescription}
                onCreateGroup={onCreateGroup}
                onJoinGroup={onJoinGroup}
                onOpenGroupChat={onOpenGroupChat}
              />
            )}

            {activeView === "tracker" && (
              <TrackerView
                statsText={statsText}
                xpProgress={xpProgress}
                hoursProgress={hoursProgress}
                activeSessionId={activeSessionId}
                onStartSession={onStartSession}
                onEndSession={onEndSession}
              />
            )}

            {activeView === "notes" && <NotesView notes={notes} onAddNote={onAddNote} />}

            {activeView === "chat" && (
              <ChatView
                globalMessages={globalMessages}
                groupMessages={groupMessages}
                selectedGroupId={selectedGroupId}
                activeSessionId={activeSessionId}
                chatInput={chatInput}
                groupChatInput={groupChatInput}
                onChatInputChange={setChatInput}
                onGroupChatInputChange={setGroupChatInput}
                onSendGlobalChat={onSendGlobalChat}
                onSendGroupChat={onSendGroupChat}
              />
            )}
          </section>
        </div>
      )}
    </div>
  );
}

export default App;
