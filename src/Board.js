import React, { useState, useRef, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";

// Компонент для отображения изображения (remains unchanged)
const ImageNote = ({ image, onDelete, onMouseDown, onResizeMouseDown, onLink, linkColor }) => {
  return (
    <div
      onMouseDown={onMouseDown}
      style={{
        position: "absolute",
        width: image.width,
        backgroundColor: "#292929",
        padding: 5,
        borderRadius: 6,
        left: image.x,
        top: image.y,
        boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
        userSelect: "none",
        border: image.isLinking ? `2px solid ${linkColor}` : "none",
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        alignItems: 'center',
        overflow: 'hidden'
      }}
    >
      <img
        src={image.src}
        alt="note image"
        style={{
          maxWidth: "100%",
          maxHeight: "calc(100% - 25px)",
          objectFit: "contain",
          display: "block",
        }}
      />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: '100%', marginTop: 5 }}>
        <button
          onClick={onDelete}
          style={{
            backgroundColor: "#000",
            color: "#fff",
            border: "none",
            padding: "2px 6px",
            fontSize: 12,
            cursor: "pointer",
          }}
        >
          Delete
        </button>
        <button
          onClick={onLink}
          style={{
            backgroundColor: image.isLinking ? linkColor : "#000",
            color: "#fff",
            border: "none",
            padding: "2px 6px",
            fontSize: 12,
            cursor: "pointer",
          }}
        >
          Connect
        </button>
        <div
          onMouseDown={onResizeMouseDown}
          style={{
            width: 10,
            height: 10,
            backgroundColor: "#aaa",
            cursor: "nwse-resize",
          }}
        />
      </div>
    </div>
  );
};

const Board = () => {
  // --- Onboarding States ---
  const [onboardingStep, setOnboardingStep] = useState(0); // 0-3: Q1-Q4, 4: Q5 (Yes/No), 5: Q6 (Yes), 6: Q7 (Name), 7: Final Greeting
  const [onboardingUserName, setOnboardingUserName] = useState(() => {
    // Load username from localStorage if available
    return localStorage.getItem('user_nickname') || '';
  });
  const [onboardingBlocked, setOnboardingBlocked] = useState(false); // State to indicate if progression is currently blocked

  // State to manage if the onboarding should be shown at all
  const [showOnboarding, setShowOnboarding] = useState(() => {
    // Check localStorage initially to see if onboarding has been completed
    const onboardingCompleted = localStorage.getItem('onboarding_completed');
    if (onboardingCompleted) {
      return false; // If already completed, don't show onboarding
    }

    // Check if the user was previously blocked
    const wasBlocked = localStorage.getItem('onboarding_blocked');
    const blockTimestamp = localStorage.getItem('onboarding_block_timestamp');
    const THIRTY_MINUTES_MS = 30 * 60 * 1000; // 30 minutes in milliseconds

    if (wasBlocked && blockTimestamp) {
      const timeElapsed = Date.now() - parseInt(blockTimestamp, 10);
      if (timeElapsed < THIRTY_MINUTES_MS) {
        // If still within the 30-minute block
        setOnboardingBlocked(true); // Set blocked state
        return true; // Keep onboarding visible to show the blocked message
      } else {
        // If 30 minutes have passed
        localStorage.removeItem('onboarding_blocked'); // Clear block status
        localStorage.removeItem('onboarding_block_timestamp'); // Clear timestamp
        return true; // Show onboarding, will proceed to Q5
      }
    }

    return true; // Show onboarding if neither completed nor blocked
  });

  // Effect to handle redirection to Q5 if unblocked after 30 minutes (Onboarding Logic)
  useEffect(() => {
    const onboardingCompleted = localStorage.getItem('onboarding_completed');
    const wasBlocked = localStorage.getItem('onboarding_blocked');
    const blockTimestamp = localStorage.getItem('onboarding_block_timestamp');
    const THIRTY_MINUTES_MS = 30 * 60 * 1000;

    // Only redirect if onboarding is not completed, not currently blocked, and was previously blocked
    if (!onboardingCompleted && !onboardingBlocked && wasBlocked && blockTimestamp) {
      const timeElapsed = Date.now() - parseInt(blockTimestamp, 10);
      if (timeElapsed >= THIRTY_MINUTES_MS) {
        // User was blocked, but now 30 mins passed. Redirect to Q5.
        setOnboardingStep(4); // Set step to 4 for Question 5
        localStorage.removeItem('onboarding_blocked'); // Ensure cleared if this runs
        localStorage.removeItem('onboarding_block_timestamp'); // Ensure cleared if this runs
      }
    }
  }, [onboardingBlocked]); // Dependency on onboardingBlocked ensures it re-evaluates if unblocked

  // Effect to handle the completion of onboarding and hide it (Onboarding Logic)
  useEffect(() => {
    // If onboarding is blocked or already hidden, don't proceed with completion logic
    if (onboardingBlocked || !showOnboarding) return;

    if (onboardingStep === 7) { // Step 7 is after final greeting
      const timer = setTimeout(() => {
        setShowOnboarding(false); // Hide the onboarding overlay
        localStorage.setItem('onboarding_completed', 'true'); // Mark as completed
        // Save the username to localStorage when onboarding is completed
        localStorage.setItem('user_nickname', onboardingUserName);
      }, 2000); // Wait 2 seconds before closing onboarding
      return () => clearTimeout(timer); // Clean up the timer
    }
  }, [onboardingStep, showOnboarding, onboardingBlocked, onboardingUserName]); // Depend on step, showOnboarding, blocked state, and username


  // Handlers for 'Ok' answers (Questions 1-4, and 6) (Onboarding Logic)
  const handleOnboardingOkAnswer = () => {
    setOnboardingStep(prevStep => prevStep + 1); // Advance to the next step
  };

  // Handler for Question 5 (Yes/No) (Onboarding Logic)
  const handleQuestion5Answer = (response) => {
    if (response === 'No') {
      setOnboardingBlocked(true);
      localStorage.setItem('onboarding_blocked', 'true'); // Mark as blocked
      localStorage.setItem('onboarding_block_timestamp', Date.now().toString()); // Save block timestamp
      // Do not change step here; the 'blocked' state will render the message
    } else {
      setOnboardingStep(prevStep => prevStep + 1); // Advance to Q6
    }
  };

  // Handler for submitting the name (Question 7) (Onboarding Logic)
  const handleNameSubmit = (e) => {
    e.preventDefault();
    if (onboardingUserName.trim()) {
      setOnboardingStep(prevStep => prevStep + 1); // Advance to final greeting
    }
  };

  // Content for each step/question (Onboarding Logic)
  const onboardingQuestions = [
    {
      text: "Lain symbolizes the boundary between the real and the virtual: she exists in both, gradually \"dissolving\" between the worlds.",
      options: [{ label: "Ok", action: handleOnboardingOkAnswer }]
    },
    {
      text: "The Wired is a world that is merging with the real, making the two worlds one and the same. Lain is God herself; she is everywhere and watches over everyone.",
      options: [{ label: "Ok", action: handleOnboardingOkAnswer }]
    },
    {
      text: "Cybergnosticism is a concept that merges the ideas of Gnosticism, an ancient philosophical and religious tradition, with themes of cyberculture, technology, and digital reality.",
      options: [{ label: "Ok", action: handleOnboardingOkAnswer }]
    },
    {
      text: "The main goal of the Knights is the unity of information and its truthfulness.",
      options: [{ label: "Ok", action: handleOnboardingOkAnswer }]
    },
    {
      text: "Lain is God herself.",
      options: [
        { label: "Yes", action: () => handleQuestion5Answer('Yes') },
        { label: "No", action: () => handleQuestion5Answer('No') }
      ]
    },
    {
      text: "Do you want to understand and connect the Wired?",
      options: [{ label: "Yes", action: handleOnboardingOkAnswer }]
    },
    {
      text: "Enter your name.", // This will be handled by the form
      isNameInput: true
    }
  ];

  // --- Main Board States ---
  const [cards, setCards] = useState([]);
  const [images, setImages] = useState([]);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [linkingFrom, setLinkingFrom] = useState(null);
  const [links, setLinks] = useState([]);
  // New state for link color
  const [linkColor, setLinkColor] = useState("#00FFFF"); // Default cyan color

  // New states for session management
  const [currentSessionName, setCurrentSessionName] = useState("Default Session");
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [sessionInput, setSessionInput] = useState("");
  const [availableSessions, setAvailableSessions] = useState([]);

  const boardRef = useRef(null);
  const isPanning = useRef(false);
  const panStart = useRef({ x: 0, y: 0 });

  // Load available sessions and default session on mount (Main Board Logic)
  useEffect(() => {
    if (!showOnboarding) { // Only load board content if onboarding is not active
      loadAvailableSessions();
      loadSession(currentSessionName);
    }
  }, [showOnboarding]); // Depend on showOnboarding to load after it's hidden

  // --- Session Save/Load Functions (Main Board Logic) ---
  const saveSession = () => {
    if (!currentSessionName) {
      alert("Please enter a session name to save.");
      return;
    }
    const sessionData = {
      cards,
      images,
      links,
      scale,
      offset,
      linkColor, // Save link color
    };
    try {
      localStorage.setItem(`board_session_${currentSessionName}`, JSON.stringify(sessionData));
      alert(`Session "${currentSessionName}" saved successfully!`);
      loadAvailableSessions();
    } catch (e) {
      console.error("Failed to save session to localStorage:", e);
      alert("Failed to save session. Please try again.");
    }
  };

  const loadSession = (name) => {
    try {
      const storedData = localStorage.getItem(`board_session_${name}`);
      if (storedData) {
        const sessionData = JSON.parse(storedData);
        setCards(sessionData.cards || []);
        setImages(sessionData.images || []);
        setLinks(sessionData.links || []);
        setScale(sessionData.scale || 1);
        setOffset(sessionData.offset || { x: 0, y: 0 });
        setLinkColor(sessionData.linkColor || "#00FFFF"); // Load link color
        setCurrentSessionName(name);
        alert(`Session "${name}" loaded successfully!`);
      } else {
        alert(`Session "${name}" not found.`);
        setCards([]);
        setImages([]);
        setLinks([]);
        setScale(1);
        setOffset({ x: 0, y: 0 });
        setLinkColor("#00FFFF"); // Reset to default if session not found
        setCurrentSessionName(name);
      }
    } catch (e) {
      console.error("Failed to load session from localStorage:", e);
      alert("Failed to load session. Data might be corrupted.");
      setCards([]);
      setImages([]);
      setLinks([]);
      setScale(1);
      setOffset({ x: 0, y: 0 });
      setLinkColor("#00FFFF"); // Reset to default on error
    } finally {
      setLinkingFrom(null);
      setShowSessionModal(false);
    }
  };

  const loadAvailableSessions = () => {
    const sessions = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("board_session_")) { // Added null check for key
        sessions.push(key.replace("board_session_", ""));
      }
    }
    setAvailableSessions(sessions);
  };

  const deleteSession = (name) => {
    if (window.confirm(`Are you sure you want to delete session "${name}"?`)) {
      localStorage.removeItem(`board_session_${name}`);
      alert(`Session "${name}" deleted.`);
      loadAvailableSessions();
      // If the current session is deleted, switch to default or clear
      if (currentSessionName === name) {
        handleNewSession("Default Session"); // Load default session if current is deleted
      }
    }
  };

  const handleNewSession = (name = "") => {
    setCards([]);
    setImages([]);
    setLinks([]);
    setScale(1);
    setOffset({ x: 0, y: 0 });
    setLinkingFrom(null);
    setLinkColor("#00FFFF"); // Reset link color for new session
    setCurrentSessionName(name || "Untitled Session");
    setShowSessionModal(false);
  };

  // --- New function to reset onboarding and prompt for new nickname ---
  const handleResetOnboarding = () => {
    if (window.confirm("Вы уверены, что хотите сбросить тест? Это вернет вас к началу и позволит обновить ник.")) {
      // Clear onboarding related localStorage items
      localStorage.removeItem('onboarding_completed');
      localStorage.removeItem('onboarding_blocked');
      localStorage.removeItem('onboarding_block_timestamp');
      localStorage.removeItem('user_nickname');

      // Reset onboarding states
      setOnboardingStep(0);
      setOnboardingUserName('');
      setOnboardingBlocked(false);
      setShowOnboarding(true); // Show onboarding again
    }
  };

  // --- Other Board Functions (Card, Image, Pan, Zoom, Link) ---
  const handleAddCard = () => {
    const newCard = {
      id: uuidv4(),
      x: (window.innerWidth / 2 - offset.x) / scale,
      y: (100 - offset.y) / scale,
      text: "",
      width: 160,
      height: 100,
      isLinking: false,
    };
    setCards([...cards, newCard]);
  };

  const handleCardChange = (id, text) => {
    setCards(cards.map(c => (c.id === id ? { ...c, text } : c)));
  };

  const handleElementMouseDown = (e, id, elementType) => {
    if (e.target.tagName.toLowerCase() === "textarea") return;

    e.preventDefault();
    e.stopPropagation();

    let startX = e.clientX;
    let startY = e.clientY;

    const setElementState = elementType === 'card' ? setCards : setImages;

    const onMouseMove = (moveEvent) => {
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;
      setElementState(prev =>
        prev.map(el =>
          el.id === id ? { ...el, x: el.x + dx / scale, y: el.y + dy / scale } : el
        )
      );
      startX = moveEvent.clientX;
      startY = moveEvent.clientY;
    };

    const onMouseUp = () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  };

  const handleElementResizeMouseDown = (e, id, elementType) => {
    e.preventDefault();
    e.stopPropagation();

    let startX = e.clientX;
    let startY = e.clientY;

    const setElementState = elementType === 'card' ? setCards : setImages;

    const onMouseMove = (moveEvent) => {
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;
      setElementState(prev =>
        prev.map(el =>
          el.id === id
            ? {
              ...el,
              width: Math.max(80, el.width + dx / scale),
              height: elementType === 'card' ? Math.max(60, el.height + dy / scale) : el.height
            }
            : el
        )
      );
      startX = moveEvent.clientX;
      startY = moveEvent.clientY;
    };

    const onMouseUp = () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  };

  const deleteCard = (id) => {
    setCards(prev => prev.filter(c => c.id !== id));
    setLinks(prev => prev.filter(link => link.from !== id && link.to !== id));
    if (linkingFrom === id) setLinkingFrom(null);
  };

  const deleteImage = (id) => {
    setImages(prev => prev.filter(img => img.id !== id));
    setLinks(prev => prev.filter(link => link.from !== id && link.to !== id));
    if (linkingFrom === id) setLinkingFrom(null);
  };

  const handleLinkElement = (id) => {
    // Сбросить подсветку со всех элементов
    setCards(prev => prev.map(c => ({ ...c, isLinking: false })));
    setImages(prev => prev.map(img => ({ ...img, isLinking: false })));

    if (!linkingFrom) {
      setLinkingFrom(id);
      setCards(prev => prev.map(c => (c.id === id ? { ...c, isLinking: true } : c)));
      setImages(prev => prev.map(img => (img.id === id ? { ...img, isLinking: true } : img)));
    } else if (linkingFrom === id) {
      setLinkingFrom(null);
    } else {
      const exists = links.some(
        (l) =>
          (l.from === linkingFrom && l.to === id) ||
          (l.from === id && l.to === linkingFrom)
      );
      if (!exists) {
        setLinks([...links, { from: linkingFrom, to: id }]);
      }
      setLinkingFrom(null);
    }
  };

  const handleWheel = (e) => {
    if (!e.shiftKey) return;

    e.preventDefault();

    const rect = boardRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const zoomAmount = -e.deltaY * 0.001;
    const newScale = Math.min(Math.max(0.1, scale + zoomAmount), 5);
    const scaleRatio = newScale / scale;

    const newOffsetX = (offset.x - mouseX) * scaleRatio + mouseX;
    const newOffsetY = (offset.y - mouseY) * scaleRatio + mouseY;

    setScale(newScale);
    setOffset({ x: newOffsetX, y: newOffsetY });
  };

  const handleMouseDown = (e) => {
    if (e.button !== 2) return;
    e.preventDefault();
    isPanning.current = true;
    panStart.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e) => {
    if (!isPanning.current) return;
    const dx = e.clientX - panStart.current.x;
    const dy = e.clientY - panStart.current.y;
    panStart.current = { x: e.clientX, y: e.clientY };
    setOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
  };

  const handleMouseUp = () => {
    isPanning.current = false;
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const files = e.dataTransfer.files;

    if (files && files.length > 0) {
      const file = files[0];
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const newImage = {
            id: uuidv4(),
            x: (e.clientX - boardRef.current.getBoundingClientRect().left - offset.x) / scale,
            y: (e.clientY - boardRef.current.getBoundingClientRect().top - offset.y) / scale,
            width: 200,
            height: 'auto',
            src: event.target.result,
            isLinking: false,
          };
          setImages((prev) => [...prev, newImage]);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const getLineRectangleIntersection = (lineStart, lineEnd, rect) => {
    const { x: x1, y: y1 } = lineStart;
    const { x: x2, y: y2 } = lineEnd;
    const { x: rx, y: ry, width: rw, height: rh } = rect;

    let intersections = [];

    const calculateIntersection = (p1x, p1y, p2x, p2y, p3x, p3y, p4x, p4y) => {
      const den = (p1x - p2x) * (p3y - p4y) - (p1y - p2y) * (p3x - p4x);
      if (den === 0) return null;

      const t = ((p1x - p3x) * (p3y - p4y) - (p1y - p3y) * (p3x - p4x)) / den;
      const u = -((p1x - p2x) * (p1y - p3y) - (p1y - p2y) * (p1x - p3x)) / den;

      if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
        return {
          x: p1x + t * (p2x - p1x),
          y: p1y + t * (p2y - p1y),
        };
      }
      return null;
    };

    let intersect = calculateIntersection(x1, y1, x2, y2, rx, ry, rx + rw, ry);
    if (intersect) intersections.push(intersect);

    intersect = calculateIntersection(x1, y1, x2, y2, rx, ry + rh, rx + rw, ry + rh);
    if (intersect) intersections.push(intersect);

    intersect = calculateIntersection(x1, y1, x2, y2, rx, ry, rx, ry + rh);
    if (intersect) intersections.push(intersect);

    intersect = calculateIntersection(x1, y1, x2, y2, rx + rw, ry, rx + rw, ry + rh);
    if (intersect) intersections.push(intersect);

    if (intersections.length > 0) {
      intersections.sort((a, b) => {
        const distA = Math.hypot(a.x - x2, a.y - y2);
        const distB = Math.hypot(b.x - x2, b.y - y2);
        return distA - distB;
      });
      return intersections[0];
    }
    return null;
  };

  const getEdgeConnectionPoint = (element1, element2) => {
    // Это очень упрощенное предположение для высоты изображений, когда height: 'auto'.
    // В реальном приложении для точного расчета нужно измерять высоту изображения
    // после его загрузки в DOM.
    const h1 = element1.height === 'auto' ? element1.width * 0.75 : element1.height;
    const h2 = element2.height === 'auto' ? element2.width * 0.75 : element2.height;

    const c1 = {
      x: element1.x,
      y: element1.y,
      width: element1.width,
      height: h1,
    };
    const c2 = {
      x: element2.x,
      y: element2.y,
      width: element2.width,
      height: h2,
    };

    const c1Center = { x: c1.x + c1.width / 2, y: c1.y + c1.height / 2 };
    const c2Center = { x: c2.x + c2.width / 2, y: c2.y + c2.height / 2 };

    const point1 = getLineRectangleIntersection(c1Center, c2Center, c1);
    const point2 = getLineRectangleIntersection(c2Center, c1Center, c2);

    return { point1, point2 };
  };

  // --- Conditional Rendering of Onboarding or Main Board ---
  if (showOnboarding) {
    // If onboarding is blocked, show the specific message
    if (onboardingBlocked) {
      return (
        <>
          <style>
            {`
              .onboarding-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: #000;
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 1000;
              }
              .onboarding-content {
                display: flex;
                flex-direction: column;
                align-items: center;
                background-color: #000;
                padding: 40px;
                border-radius: 10px;
                box-shadow: 0 0 20px rgba(0,0,0,0.7);
                color: white;
                text-align: center;
                max-width: 90%;
                border: 1px solid #222;
                transform: scale(0.6); /* Keep consistent scaling for blocked message */
                transform-origin: center center;
              }
              .question-text {
                font-size: 1.8em;
                margin-bottom: 20px;
              }
              .blocked-message {
                font-size: 2em;
                color:rgb(255, 0, 0); /* Red color for warning/blocked state */
              }
            `}
          </style>
          <div className="onboarding-overlay">
            <div className="onboarding-content">
              <p className="question-text blocked-message">Think it over and come back in 30 minutes.

</p>
            </div>
          </div>
        </>
      );
    }

    // Render current question/step
    const currentOnboardingQuestion = onboardingQuestions[onboardingStep];

    return (
      <>
        {/* IMPORTANT: For production, move this <style> block to your Board.css file
            or a dedicated Onboarding.css file and import it. */}
        <style>
          {`
            .onboarding-overlay {
              position: fixed;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              background-color: #000; /* Pure black, full-size background */
              display: flex;
              justify-content: center;
              align-items: center;
              z-index: 1000;
            }

            .onboarding-content {
              display: flex;
              flex-direction: column;
              align-items: center;
              background-color: #000; /* Pure black for the content box */
              padding: 40px;
              border-radius: 10px;
              box-shadow: 0 0 20px rgba(0, 0, 0, 0.7); /* Keep shadow for depth */
              color: white;
              text-align: center;
              max-width: 90%;
              border: 1px solid #222; /* Add a subtle dark border for definition */

              /* Scale the content box */
              transform: scale(0.6); /* Adjusted scale: Larger than 0.333, smaller than 1 */
              transform-origin: center center; /* Ensure it scales from the center */
            }

            .welcome-gif {
              max-width: 100%;
              height: auto;
              margin-bottom: 30px;
              border-radius: 5px;
            }

            .question-container {
              margin-top: 20px;
            }

            .question-text {
              font-size: 1.8em;
              margin-bottom: 20px;
            }

            .options button {
              background-color: rgb(5, 5, 5); /* Black button color */
              color: white;
              border: none;
              padding: 12px 25px;
              margin: 0 10px;
              border-radius: 5px;
              cursor: pointer;
              font-size: 1.1em;
              transition: background-color 0.3s ease;
            }

            .options button:hover {
              background-color: rgb(20, 20, 20); /* Slightly lighter black on hover */
            }

            .name-form {
              display: flex;
              flex-direction: column;
              align-items: center;
              gap: 15px;
              margin-top: 20px;
            }

            .name-form input[type="text"] {
              padding: 10px 15px;
              font-size: 1.1em;
              border: 1px solid #444; /* Slightly lighter border for input field */
              border-radius: 5px;
              width: 250px;
              max-width: 90%;
              text-align: center;
              box-sizing: border-box;
              background-color: #111; /* Darker background for input */
              color: white; /* Ensure text is visible */
            }

            .name-form button {
              background-color:rgb(5, 5, 5); /* Green for OK button */
              color: white;
              border: none;
              padding: 10px 20px;
              border-radius: 5px;
              cursor: pointer;
              font-size: 1.1em;
              transition: background-color 0.3s ease;
            }

            .name-form button:hover {
              background-color:rgb(5, 5, 5); /* Darker green on hover */
            }
          `}
        </style>

        <div className="onboarding-overlay">
          <div className="onboarding-content">
            {onboardingStep === 0 && ( // Initial GIF + Q1
              <>
                <img src="https://i.imgur.com/YYADbHI.gif" alt="Welcome GIF" className="welcome-gif" />
                <div className="question-container">
                  <p className="question-text">{onboardingQuestions[0].text}</p>
                  <div className="options">
                    <button onClick={onboardingQuestions[0].options[0].action}>{onboardingQuestions[0].options[0].label}</button>
                  </div>
                </div>
              </>
            )}

            {onboardingStep >= 1 && onboardingStep <= 3 && ( // Q2, Q3, Q4
              <div className="question-container">
                <p className="question-text">{onboardingQuestions[onboardingStep].text}</p>
                <div className="options">
                  <button onClick={onboardingQuestions[onboardingStep].options[0].action}>{onboardingQuestions[onboardingStep].options[0].label}</button>
                </div>
              </div>
            )}

            {onboardingStep === 4 && ( // Q5: Yes/No
              <div className="question-container">
                <p className="question-text">{onboardingQuestions[onboardingStep].text}</p>
                <div className="options">
                  <button onClick={onboardingQuestions[onboardingStep].options[0].action}>{onboardingQuestions[onboardingStep].options[0].label}</button>
                  <button onClick={onboardingQuestions[onboardingStep].options[1].action}>{onboardingQuestions[onboardingStep].options[1].label}</button>
                </div>
              </div>
            )}

            {onboardingStep === 5 && ( // Q6: Yes
              <div className="question-container">
                <p className="question-text">{onboardingQuestions[onboardingStep].text}</p>
                <div className="options">
                  <button onClick={onboardingQuestions[onboardingStep].options[0].action}>{onboardingQuestions[onboardingStep].options[0].label}</button>
                </div>
              </div>
            )}

            {onboardingStep === 6 && ( // Q7: Enter name
              <div className="question-container">
                <p className="question-text">{onboardingQuestions[onboardingStep].text}</p>
                <form onSubmit={handleNameSubmit} className="name-form">
                  <input
                    type="text"
                    value={onboardingUserName}
                    onChange={(e) => setOnboardingUserName(e.target.value)}
                    placeholder="Your name?"
                  />
                  <button type="submit">OK</button>
                </form>
              </div>
            )}

            {onboardingStep === 7 && ( // Final greeting
              <div className="question-container">
                <p className="question-text">Hi, {onboardingUserName}!</p>
              </div>
            )}
          </div>
        </div>
      </>
    );
  }

  // --- If onboarding is not active, render the main Board content ---
  return (
    <div
      ref={boardRef}
      style={{
        width: "100vw",
        height: "100vh",
        backgroundColor: "#191919",
        overflow: "hidden",
        position: "relative",
        userSelect: "none",
      }}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onContextMenu={(e) => e.preventDefault()}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div style={{
          position: "absolute",
          top: 10,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 1000,
          display: "flex",
          gap: "10px"
      }}>
        <button
          onClick={handleAddCard}
          style={{
            backgroundColor: "#000",
            color: "#fff",
            border: "none",
            padding: "8px 12px",
            borderRadius: 4,
            cursor: "pointer",
          }}
        >
          Add Note
        </button>
        <button
          onClick={() => setShowSessionModal(true)}
          style={{
            backgroundColor: "#000",
            color: "#fff",
            border: "none",
            padding: "8px 12px",
            borderRadius: 4,
            cursor: "pointer",
          }}
        >
          Sessions
        </button>
        {/* New Reset Onboarding button */}
        <button
          onClick={handleResetOnboarding}
          style={{
            backgroundColor: "#000", /* A slightly redder color for "Reset" */
            color: "#fff",
            border: "none",
            padding: "8px 12px",
            borderRadius: 4,
            cursor: "pointer",
          }}
        >
          Reset
        </button>
        {/* New button for changing link color */}
        <input
          type="color"
          value={linkColor}
          onChange={(e) => setLinkColor(e.target.value)}
          style={{
            width: "40px",
            height: "36px",
            padding: "0",
            border: "none",
            borderRadius: 4,
            cursor: "pointer",
            backgroundColor: "transparent",
          }}
          title="Change Link Color"
        />
      </div>

      {/* Текущее имя сеанса */}
      <div style={{
          position: "absolute",
          top: 10,
          left: 10,
          zIndex: 1000,
          color: "#fff",
          fontSize: 14,
      }}>
        Current Session: {currentSessionName}
      </div>

      {/* Display user's nickname */}
      {onboardingUserName && (
        <div style={{
          position: "absolute",
          top: 35, // Below Current Session
          left: 10,
          zIndex: 1000,
          color: "#fff",
          fontSize: 14,
        }}>
          Hi, {onboardingUserName}!
        </div>
      )}

      {/* Session Modal */}
      {showSessionModal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          backgroundColor: "rgba(0, 0, 0, 0.82)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 2000,
        }}>
          <div style={{
            backgroundColor: "#0a0a0a",
            padding: "20px",
            borderRadius: "8px",
            color: "#fff",
            width: "300px",
            maxHeight: "80vh",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: "15px",
          }}>
            <h3>Manage Sessions</h3>
            <div style={{ display: "flex", gap: "10px" }}>
              <input
                type="text"
                value={sessionInput}
                onChange={(e) => setSessionInput(e.target.value)}
                placeholder="Session Name"
                style={{ flexGrow: 1, padding: "8px", borderRadius: "4px", border: "1px solid #444", backgroundColor: "#333", color: "#fff" }}
              />
              <button onClick={() => { setCurrentSessionName(sessionInput); saveSession(); setSessionInput(""); }} style={{ backgroundColor: "#1f0404", color: "#fff", border: "none", padding: "8px 12px", borderRadius: "4px", cursor: "pointer" }}>Save</button>
            </div>
            <button onClick={() => handleNewSession()} style={{ backgroundColor: "#1f0404", color: "#fff", border: "none", padding: "8px 12px", borderRadius: "4px", cursor: "pointer" }}>New Session</button>

            <h4>Available Sessions:</h4>
            {availableSessions.length === 0 ? (
              <p>No sessions saved.</p>
            ) : (
              <ul style={{ listStyle: "none", padding: 0 }}>
                {availableSessions.map((name) => (
                  <li key={name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px", background: "#333", padding: "8px", borderRadius: "4px" }}>
                    <span style={{ cursor: "pointer", flexGrow: 1 }} onClick={() => loadSession(name)}>{name}</span>
                    <button onClick={() => loadSession(name)} style={{ backgroundColor: "#1a1a1a", color: "#fff", border: "none", padding: "5px 10px", borderRadius: "4px", cursor: "pointer", marginRight: "5px" }}>Load</button>
                    <button onClick={() => deleteSession(name)} style={{ backgroundColor: "#1a1a1a", color: "#fff", border: "none", padding: "5px 10px", borderRadius: "4px", cursor: "pointer" }}>Delete</button>
                  </li>
                ))}
              </ul>
            )}
            <button onClick={() => setShowSessionModal(false)} style={{ backgroundColor: "#0f0f0f", color: "#fff", border: "none", padding: "8px 12px", borderRadius: "4px", cursor: "pointer" }}>Close</button>
          </div>
        </div>
      )}

      <div
        style={{
          transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
          transformOrigin: "0 0",
          width: "100%",
          height: "100%",
          position: "absolute",
        }}
      >
        {cards.map((card) => (
          <div
            key={card.id}
            onMouseDown={(e) => handleElementMouseDown(e, card.id, 'card')}
            style={{
              position: "absolute",
              width: card.width,
              height: card.height,
              backgroundColor: "#292929",
              padding: 10,
              borderRadius: 6,
              left: card.x,
              top: card.y,
              boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
              userSelect: "none",
              border: card.isLinking ? `2px solid ${linkColor}` : "none",
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <textarea
              value={card.text}
              onChange={(e) => handleCardChange(card.id, e.target.value)}
              style={{
                width: "100%",
                height: "calc(100% - 25px)",
                border: "none",
                backgroundColor: "transparent",
                color: "#fff",
                resize: "none",
                outline: "none",
                fontFamily: "Arial, sans-serif",
                fontSize: 14,
              }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: '100%', marginTop: 5 }}>
              <button
                onClick={() => deleteCard(card.id)}
                style={{
                  backgroundColor: "#000",
                  color: "#fff",
                  border: "none",
                  padding: "2px 6px",
                  fontSize: 12,
                  cursor: "pointer",
                }}
              >
                Delete
              </button>
              <button
                onClick={() => handleLinkElement(card.id)}
                style={{
                  backgroundColor: card.isLinking ? linkColor : "#000",
                  color: "#fff",
                  border: "none",
                  padding: "2px 6px",
                  fontSize: 12,
                  cursor: "pointer",
                }}
              >
                Connect
              </button>
              <div
                onMouseDown={(e) => handleElementResizeMouseDown(e, card.id, 'card')}
                style={{
                  width: 10,
                  height: 10,
                  backgroundColor: "#aaa",
                  cursor: "nwse-resize",
                }}
              />
            </div>
          </div>
        ))}

        {images.map((image) => (
          <ImageNote
            key={image.id}
            image={image}
            onDelete={() => deleteImage(image.id)}
            onMouseDown={(e) => handleElementMouseDown(e, image.id, 'image')}
            onResizeMouseDown={(e) => handleElementResizeMouseDown(e, image.id, 'image')}
            onLink={() => handleLinkElement(image.id)}
            linkColor={linkColor} // Pass linkColor to ImageNote
          />
        ))}

        <svg
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "1000%",
            height: "1000%",
            pointerEvents: "none",
          }}
        >
          {links.map((link, index) => {
            const fromElement = cards.find(c => c.id === link.from) || images.find(img => img.id === link.from);
            const toElement = cards.find(c => c.id === link.to) || images.find(img => img.id === link.to);

            if (!fromElement || !toElement) return null;

            const { point1, point2 } = getEdgeConnectionPoint(fromElement, toElement);

            if (!point1 || !point2) return null;

            const arrowSize = 8;
            const angle = Math.atan2(point2.y - point1.y, point2.x - point1.x);

            return (
              <g key={index}>
                <line
                  x1={point1.x}
                  y1={point1.y}
                  x2={point2.x}
                  y2={point2.y}
                  stroke={linkColor} // Use linkColor for the line
                  strokeWidth="2"
                />
                <polygon
                  points={`${point2.x},${point2.y} 
                           ${point2.x - arrowSize * Math.cos(angle - Math.PI / 6)},${point2.y - arrowSize * Math.sin(angle - Math.PI / 6)} 
                           ${point2.x - arrowSize * Math.cos(angle + Math.PI / 6)},${point2.y - arrowSize * Math.sin(angle + Math.PI / 6)}`}
                  fill={linkColor} // Use linkColor for the arrow head
                />
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};

export default Board;