import { useMemo, useState, useRef, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { Phone, PhoneOff, Delete } from "lucide-react";
import { logAgentCallAttempt, setMyDirectCallStatus, getCampaigns, getLeadByPhone, createLead } from "../services/api";
import { useAuth } from "../hooks/useAuth";
import EditLeadModal from "../components/modals/EditLeadModal";

// DTMF frequency pairs (Hz)
const DTMF_FREQUENCIES = {
  1: [697, 1209],
  2: [697, 1336],
  3: [697, 1477],
  4: [770, 1209],
  5: [770, 1336],
  6: [770, 1477],
  7: [852, 1209],
  8: [852, 1336],
  9: [852, 1477],
  "*": [941, 1209],
  0: [941, 1336],
  "#": [941, 1477],
};

// Utility: Create audio context and generate DTMF tone
const generateDTMFTone = (frequencies, duration = 100) => {
  try {
    const audioContext = new (
      window.AudioContext || window.webkitAudioContext
    )();
    const gainNode = audioContext.createGain();
    gainNode.connect(audioContext.destination);
    gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
      0.01,
      audioContext.currentTime + duration / 1000,
    );

    frequencies.forEach((freq) => {
      const osc = audioContext.createOscillator();
      osc.frequency.value = freq;
      osc.connect(gainNode);
      osc.start(audioContext.currentTime);
      osc.stop(audioContext.currentTime + duration / 1000);
    });

    return audioContext;
  } catch (e) {
    console.error("DTMF Error:", e);
  }
};

// Sound effect generators
const playDialTone = () => {
  try {
    const audioContext = new (
      window.AudioContext || window.webkitAudioContext
    )();
    const gainNode = audioContext.createGain();
    gainNode.connect(audioContext.destination);

    const osc1 = audioContext.createOscillator();
    const osc2 = audioContext.createOscillator();
    osc1.frequency.value = 350;
    osc2.frequency.value = 440;

    osc1.connect(gainNode);
    osc2.connect(gainNode);

    gainNode.gain.setValueAtTime(0.08, audioContext.currentTime);
    osc1.start(audioContext.currentTime);
    osc2.start(audioContext.currentTime);
    osc1.stop(audioContext.currentTime + 2);
    osc2.stop(audioContext.currentTime + 2);
  } catch (e) {
    console.error("Dial Tone Error:", e);
  }
};

const playBusyTone = () => {
  try {
    const audioContext = new (
      window.AudioContext || window.webkitAudioContext
    )();
    const gainNode = audioContext.createGain();
    gainNode.connect(audioContext.destination);

    const osc = audioContext.createOscillator();
    osc.frequency.value = 480;
    osc.connect(gainNode);

    gainNode.gain.setValueAtTime(0.08, audioContext.currentTime);
    osc.start(audioContext.currentTime);

    for (let i = 0; i < 6; i++) {
      gainNode.gain.setValueAtTime(0.08, audioContext.currentTime + i * 1);
      gainNode.gain.setValueAtTime(0, audioContext.currentTime + i * 1 + 0.5);
    }

    osc.stop(audioContext.currentTime + 6);
  } catch (e) {
    console.error("Busy Tone Error:", e);
  }
};

const playDisconnectTone = () => {
  try {
    const audioContext = new (
      window.AudioContext || window.webkitAudioContext
    )();
    const gainNode = audioContext.createGain();
    gainNode.connect(audioContext.destination);

    const osc = audioContext.createOscillator();
    osc.frequency.value = 350;
    osc.connect(gainNode);

    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
      0.001,
      audioContext.currentTime + 0.3,
    );

    osc.start(audioContext.currentTime);
    osc.stop(audioContext.currentTime + 0.3);
  } catch (e) {
    console.error("Disconnect Tone Error:", e);
  }
};

const formatDisplayNumber = (value) =>
  String(value || "").replace(/[^\d+]/g, "");

export default function DirectDialerPage() {
  const { showNotification, twilioDialer } = useOutletContext();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [callMethod, setCallMethod] = useState("zoom");
  const [inCallDigits, setInCallDigits] = useState("");
  const [isZoomCallActive, setIsZoomCallActive] = useState(false);

  const [campaigns, setCampaigns] = useState([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState("");
  const [activeLead, setActiveLead] = useState(null);
  const [showDispositionModal, setShowDispositionModal] = useState(false);
  const [isCheckingLead, setIsCheckingLead] = useState(false);

  const inputRef = useRef(null);
  const pressedKeysRef = useRef(new Set());
  const { user } = useAuth();

  // Fetch campaigns on mount
  useEffect(() => {
    getCampaigns()
      .then((data) => {
        // data contains root (parent) campaigns with their children nested
        const autoCampaigns = [];
        (data || []).forEach((parent) => {
          if (parent.children && parent.children.length > 0) {
            parent.children.forEach((child) => {
              if (child.pipelineType === "caller" && child.dialerType === "auto") {
                // Prepend parent name for clarity
                autoCampaigns.push({
                  ...child,
                  displayName: `${parent.name} > ${child.name}`,
                });
              }
            });
          }
        });
        setCampaigns(autoCampaigns);
      })
      .catch((err) => console.error("Failed to load campaigns", err));
  }, []);

  const isDialing =
    twilioDialer?.callStatus === "ringing" ||
    twilioDialer?.callStatus === "connected";
  const isInCall =
    callMethod === "twilio" &&
    (twilioDialer?.callStatus === "ringing" ||
      twilioDialer?.callStatus === "connected");

  // Auto-focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Keyboard handler
  useEffect(() => {
    const handleKeyDown = (e) => {
      const key = e.key;

      if (pressedKeysRef.current.has(key)) return;

      if (/^[0-9]$/.test(key)) {
        pressedKeysRef.current.add(key);
        e.preventDefault();
        handleKeypadPress(key);
        return;
      }

      if (key === "*" || key === "#") {
        pressedKeysRef.current.add(key);
        e.preventDefault();
        handleKeypadPress(key);
        return;
      }

      if (key === "Backspace") {
        pressedKeysRef.current.add(key);
        e.preventDefault();
        handleBackspace();
        return;
      }

      if (key === "Enter" && phoneNumber && !isDialing) {
        pressedKeysRef.current.add(key);
        e.preventDefault();
        handleDial();
        return;
      }

      if (key === "Delete") {
        pressedKeysRef.current.add(key);
        e.preventDefault();
        clearNumber();
        return;
      }
    };

    const handleKeyUp = (e) => {
      pressedKeysRef.current.delete(e.key);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [phoneNumber, isDialing, isInCall]);

  const statusText = useMemo(() => {
    if (twilioDialer?.error) return twilioDialer.error;
    if (callMethod === "zoom") return "Zoom handles call externally";
    if (twilioDialer?.isInitializing) return "Connecting to Twilio...";
    switch (twilioDialer?.callStatus) {
      case "ringing":
        return "Ringing...";
      case "connected":
        return "In Call";
      default:
        return twilioDialer?.isReady ? "Ready to dial" : "Twilio not connected";
    }
  }, [
    twilioDialer?.error,
    twilioDialer?.isInitializing,
    twilioDialer?.callStatus,
    twilioDialer?.isReady,
    callMethod,
  ]);

  const appendDigit = (digit) => {
    setPhoneNumber((prev) => `${prev}${digit}`.slice(0, 20));
    if (!isInCall) {
      generateDTMFTone(DTMF_FREQUENCIES[digit], 100);
    }
  };

  const clearNumber = () => setPhoneNumber("");

  const handleBackspace = () => {
    setPhoneNumber((prev) => prev.slice(0, -1));
  };

  const handleDial = async () => {
    if (!phoneNumber) return;
    try {
      playDialTone();

      if (isDialing) return;

      await logAgentCallAttempt({
        phoneNumber,
        platform: callMethod,
        outcome: "attempted",
      });

      let callSuccessful = false;

      if (callMethod === "zoom") {
        await setMyDirectCallStatus(true, "zoom");
        setIsZoomCallActive(true);
        window.open(`zoomphonecall://${phoneNumber}`, "_self");
        showNotification(`Calling ${phoneNumber} via Zoom`, "success");
        callSuccessful = true;
      } else if (typeof twilioDialer?.placeOutgoingCall === "function") {
        const result = await twilioDialer.placeOutgoingCall(phoneNumber);
        if (result?.success) {
          showNotification(`Calling ${result.number} via Twilio`, "success");
          setInCallDigits("");
          callSuccessful = true;
        } else {
          playBusyTone();
          showNotification(result?.error || "Twilio call failed", "error");
        }
      } else {
        showNotification("Twilio dialer not available", "error");
      }

      if (callSuccessful && selectedCampaignId) {
        setIsCheckingLead(true);
        try {
          let lead;
          try {
            lead = await getLeadByPhone(phoneNumber);
          } catch (err) {
            // not found
          }

          if (lead) {
            setActiveLead(lead);
            setShowDispositionModal(true);
          } else {
            const newLead = await createLead({
              campaignId: selectedCampaignId,
              phoneNumber,
            });
            setActiveLead(newLead);
            setShowDispositionModal(true);
          }
        } catch (err) {
          showNotification("Failed to check or create lead automatically", "error");
        } finally {
          setIsCheckingLead(false);
        }
      }
    } catch (error) {
      playBusyTone();
      showNotification("Failed to start call", "error");
    }
  };

  const handleHangup = async () => {
    if (callMethod === "twilio") {
      playDisconnectTone();
      twilioDialer?.hangupActiveCall?.();
      showNotification("Call ended", "info");
    } else {
      void setMyDirectCallStatus(false, "zoom");
      setIsZoomCallActive(false);
      showNotification("End call from Zoom app", "info");
    }
  };

  useEffect(() => {
    if (callMethod !== "zoom" || !isZoomCallActive) return undefined;

    return () => {
      void setMyDirectCallStatus(false, "zoom");
    };
  }, [callMethod, isZoomCallActive]);

  const handleKeypadPress = (digit) => {
    if (isInCall && twilioDialer?.activeCall) {
      twilioDialer.activeCall.sendDigits(digit);
      generateDTMFTone(DTMF_FREQUENCIES[digit], 100);
      setInCallDigits((prev) => `${prev}${digit}`.slice(0, 20));
      console.log("Sent DTMF:", digit);
    } else {
      appendDigit(digit);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-linear-to-r from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-700 rounded-lg shadow-2xl dark:shadow-slate-900/30 p-6 border border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-3">
          <div className="bg-linear-to-r from-cyan-500 to-blue-500 rounded p-2">
            <Phone className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              Direct Dialer
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-2">
              Call any number — use keyboard or keypad
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto bg-linear-to-br from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-700 rounded-lg shadow-2xl dark:shadow-slate-900/30 border border-slate-200 dark:border-slate-700 p-6">
        
        {/* Campaign Selector */}
        <div className="mb-4">
          <label className="block text-sm text-slate-700 dark:text-slate-300 mb-1">
            Campaign (Optional)
          </label>
          <select
            value={selectedCampaignId}
            onChange={(e) => setSelectedCampaignId(e.target.value)}
            className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-slate-900 dark:text-white outline-none focus:border-cyan-500"
          >
            <option value="">No Campaign</option>
            {campaigns.map((c) => (
              <option key={c._id} value={c._id}>
                {c.displayName}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-4">
          <label className="block text-sm text-slate-700 dark:text-slate-300 mb-1">
            Call Method
          </label>
          <select
            value={callMethod}
            onChange={(e) => setCallMethod(e.target.value)}
            className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-slate-900 dark:text-white outline-none focus:border-cyan-500"
          >
            <option value="">Select Any Method</option>
            <option value="twilio">Twilio</option>
            <option value="zoom">Zoom</option>
          </select>
        </div>

        <div className="mb-4 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-700/40 px-4 py-3">
          <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">
            Status
          </p>
          <p
            className={`text-sm font-semibold ${
              twilioDialer?.error
                ? "text-red-400"
                : callMethod === "zoom"
                  ? "text-cyan-400"
                  : twilioDialer?.callStatus === "connected"
                    ? "text-green-400"
                    : "text-slate-400"
            }`}
          >
            {statusText}
          </p>
        </div>

        <label className="block text-sm text-slate-700 dark:text-slate-300 mb-2">
          Phone Number
        </label>
        <input
          ref={inputRef}
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(formatDisplayNumber(e.target.value))}
          onKeyDown={(e) => {
            if (e.key === "Enter" && phoneNumber && !isDialing) {
              handleDial();
            }
          }}
          placeholder="+1 405 555 1212"
          className="w-full mb-4 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-slate-900 dark:text-white outline-none focus:border-cyan-500 text-lg"
        />

        {/* Keyboard shortcuts hint */}
        <div className="mb-4 p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
          <p className="text-xs text-blue-600 dark:text-blue-400">
            ⌨️ Keys: 0-9, Enter to call, Backspace to delete, Delete to clear
          </p>
        </div>

        {/* In-call DTMF display */}
        {isInCall && inCallDigits && (
          <div className="mb-4 p-3 rounded-lg bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700">
            <p className="text-xs text-green-600 dark:text-green-300 mb-1">
              Digits sent
            </p>
            <p className="text-sm font-mono text-green-800 dark:text-green-200">
              {inCallDigits}
            </p>
          </div>
        )}

        <div className="grid grid-cols-3 gap-2 mb-4">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9", "*", "0", "#"].map(
            (digit) => (
              <button
                key={digit}
                onClick={() => handleKeypadPress(digit)}
                className="rounded-lg border border-slate-300/80 dark:border-slate-600 bg-slate-100 dark:bg-slate-700/80 py-3 text-slate-800 dark:text-slate-100 font-semibold shadow-sm transition hover:-translate-y-0.5 hover:bg-cyan-50 dark:hover:bg-slate-600 hover:text-cyan-700 dark:hover:text-cyan-200 hover:border-cyan-300 dark:hover:border-cyan-500 active:scale-95"
                type="button"
              >
                {digit}
              </button>
            ),
          )}
        </div>

        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={clearNumber}
            type="button"
            className="rounded-lg bg-amber-500/15 dark:bg-amber-500/20 border border-amber-500/30 py-2 text-sm font-semibold text-amber-800 dark:text-amber-200 shadow-sm transition hover:-translate-y-0.5 hover:bg-amber-500/25 dark:hover:bg-amber-500/30 hover:border-amber-400"
          >
            Clear All
          </button>

          <button
            onClick={handleDial}
            disabled={
              !phoneNumber ||
              isDialing ||
              (callMethod === "twilio" &&
                (!twilioDialer?.isReady || twilioDialer?.error))
            }
            type="button"
            className="rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 py-2 text-sm font-semibold text-white shadow-md shadow-emerald-500/25 transition hover:-translate-y-0.5 hover:from-emerald-600 hover:to-teal-600 disabled:bg-slate-300 dark:disabled:bg-slate-600 disabled:text-slate-500 dark:disabled:text-slate-400 disabled:shadow-none active:scale-95"
          >
            <span className="inline-flex items-center gap-2">
              <Phone className="w-4 h-4" />
              {isDialing ? "Calling..." : "Call"}
            </span>
          </button>

          <button
            onClick={handleBackspace}
            disabled={!phoneNumber}
            type="button"
            className="rounded-lg bg-rose-500/15 dark:bg-rose-500/20 border border-rose-500/30 py-2 text-sm font-semibold text-rose-800 dark:text-rose-200 shadow-sm transition hover:-translate-y-0.5 hover:bg-rose-500/25 dark:hover:bg-rose-500/30 hover:border-rose-400 disabled:bg-slate-200 dark:disabled:bg-slate-700 disabled:text-slate-500 dark:disabled:text-slate-400 disabled:border-slate-300 dark:disabled:border-slate-600 disabled:shadow-none"
          >
            <span className="inline-flex items-center gap-2">
              <Delete className="w-4 h-4" />
              Backspace
            </span>
          </button>
        </div>

        <button
          onClick={handleHangup}
          disabled={!twilioDialer?.activeCall && !isZoomCallActive}
          type="button"
          className="mt-3 w-full rounded-lg bg-slate-400/20 dark:bg-slate-600/40 border border-slate-300 dark:border-slate-600 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 shadow-sm disabled:cursor-not-allowed disabled:opacity-70 transition hover:-translate-y-0.5 active:scale-95 flex justify-center"
        >
          {isCheckingLead ? (
            <span className="inline-flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></span>
              Checking lead...
            </span>
          ) : (
            <span className="inline-flex items-center gap-2">
              <PhoneOff className="w-4 h-4" />
              Hang Up
            </span>
          )}
        </button>
      </div>

      <EditLeadModal
        isOpen={showDispositionModal}
        lead={activeLead}
        onClose={() => {
          setShowDispositionModal(false);
          setActiveLead(null);
          setPhoneNumber(""); // clear phone after disposition
        }}
        onSave={(updatedLead) => {
          showNotification("Disposition saved", "success");
        }}
        hideCloseButton={true}
      />
    </div>
  );
}
