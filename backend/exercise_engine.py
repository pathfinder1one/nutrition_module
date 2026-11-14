"""Small, explicit exercise analysers. Add one analyser class and one registry entry per exercise."""
from __future__ import annotations

from collections import deque
from dataclasses import dataclass
import time
from typing import NamedTuple

import numpy as np


@dataclass(frozen=True)
class ExerciseInfo:
    id: str
    name: str
    camera_hint: str
    instruction: str


@dataclass
class Evaluation:
    label: str
    sustained_bad: bool
    primary: float | None = None
    secondary: float | None = None
    primary_name: str = ""
    secondary_name: str = ""


class PoseSide(NamedTuple):
    shoulder: object
    elbow: object
    wrist: object
    hip: object
    knee: object
    ankle: object


def angle(a: object, b: object, c: object) -> float:
    a_xy, b_xy, c_xy = np.array([a.x, a.y]), np.array([b.x, b.y]), np.array([c.x, c.y])
    radians = np.arctan2(c_xy[1] - b_xy[1], c_xy[0] - b_xy[0]) - np.arctan2(a_xy[1] - b_xy[1], a_xy[0] - b_xy[0])
    value = abs(np.degrees(radians))
    return float(360 - value if value > 180 else value)


def distance(a: object, b: object) -> float:
    return float(np.hypot(a.x - b.x, a.y - b.y))


class Analyzer:
    info: ExerciseInfo
    uses_timer = False

    def __init__(self) -> None:
        self.reset()

    def reset(self) -> None:
        self.phase = "ready"
        self.total_reps = self.good_reps = self.bad_reps = 0
        self.rep_was_bad = False
        self.bad_frames = 0

    def bad_state(self, bad: bool) -> bool:
        self.bad_frames = self.bad_frames + 1 if bad else 0
        return self.bad_frames >= 8

    def finish_rep(self, bad: bool) -> None:
        self.total_reps += 1
        if self.rep_was_bad or bad:
            self.bad_reps += 1
        else:
            self.good_reps += 1
        self.rep_was_bad = False

    def counter_text(self) -> str:
        return f"REPS  {self.total_reps}"

    @staticmethod
    def visible_side(points: list[object]) -> PoseSide | None:
        for ids in ((11,13,15,23,25,27), (12,14,16,24,26,28)):
            selected = [points[index] for index in ids]
            if all(getattr(point, "visibility", 1.0) >= .55 for point in selected):
                return PoseSide(*selected)
        return None

    @staticmethod
    def full_body(points: list[object], ids: tuple[int, ...]) -> bool:
        return len(points) >= 33 and all(getattr(points[index], "visibility", 1.0) >= .55 for index in ids)

    def evaluate(self, points: list[object] | None) -> Evaluation:
        raise NotImplementedError


class PushUpAnalyzer(Analyzer):
    info = ExerciseInfo("pushup", "Push-up", "Side view · camera low", "Keep your body straight. Lower your chest, then press back up.")

    def __init__(self) -> None:
        self.arm_values: deque[float] = deque(maxlen=5)
        self.body_values: deque[float] = deque(maxlen=5)
        super().__init__()

    def reset(self) -> None:
        super().reset(); self.arm_values.clear(); self.body_values.clear(); self.phase = "up"

    def evaluate(self, points: list[object] | None) -> Evaluation:
        if not points: self.bad_frames = 0; return Evaluation("NO PERSON", False)
        side = self.visible_side(points)
        if side is None: self.bad_frames = 0; return Evaluation("MOVE FULL BODY INTO FRAME", False)
        arm, body = angle(side.shoulder, side.elbow, side.wrist), angle(side.shoulder, side.hip, side.knee)
        self.arm_values.append(arm); self.body_values.append(body); arm, body = float(np.mean(self.arm_values)), float(np.mean(self.body_values))
        in_position = abs(side.shoulder.y - side.ankle.y) < .50 and side.wrist.y > side.shoulder.y - .04 and body > 118
        if not in_position: self.bad_frames = 0; return Evaluation("GET INTO PUSH-UP POSITION", False, arm, body, "Arm", "Body")
        bad = body < 150
        if self.phase == "up" and arm <= 105: self.phase, self.rep_was_bad = "down", bad
        elif self.phase == "down":
            self.rep_was_bad |= bad
            if arm >= 155: self.phase = "up"; self.finish_rep(bad)
        return Evaluation("BAD FORM: KEEP BODY STRAIGHT" if bad else "GOOD FORM", self.bad_state(bad), arm, body, "Arm", "Body")


class SquatAnalyzer(Analyzer):
    info = ExerciseInfo("squat", "Bodyweight squat", "Front or side view · feet visible", "Stand tall, lower under control, then return to standing.")

    def __init__(self) -> None:
        self.knee_values: deque[float] = deque(maxlen=5)
        super().__init__()

    def reset(self) -> None:
        super().reset(); self.knee_values.clear(); self.phase = "up"

    def evaluate(self, points: list[object] | None) -> Evaluation:
        ids = (11,12,23,24,25,26,27,28)
        if not points: self.bad_frames = 0; return Evaluation("NO PERSON", False)
        if not self.full_body(points, ids): self.bad_frames = 0; return Evaluation("MOVE FULL BODY INTO FRAME", False)
        left, right = angle(points[23], points[25], points[27]), angle(points[24], points[26], points[28])
        knee = (left + right) / 2; self.knee_values.append(knee); knee = float(np.mean(self.knee_values))
        hip_width, ankle_width, knee_width = distance(points[23], points[24]), distance(points[27], points[28]), distance(points[25], points[26])
        standing = knee > 145 and abs(points[23].y - points[24].y) < .16
        if ankle_width < max(.06, hip_width * .55): self.bad_frames = 0; return Evaluation("STEP BACK: SHOW BOTH FEET", False, knee, None, "Knee", "")
        # Knees visibly collapsing inside a stable foot stance is a reliable frontal-view warning.
        knee_cave = ankle_width > hip_width * .9 and knee_width < ankle_width * .60
        bad = knee_cave
        if self.phase == "up" and knee <= 105: self.phase, self.rep_was_bad = "down", bad
        elif self.phase == "down":
            self.rep_was_bad |= bad
            if knee >= 160: self.phase = "up"; self.finish_rep(bad)
        label = "BAD FORM: KEEP KNEES OUT" if bad else "GOOD FORM" if standing or self.phase == "down" else "GET READY"
        return Evaluation(label, self.bad_state(bad), knee, None, "Knee", "")


class JumpingJackAnalyzer(Analyzer):
    info = ExerciseInfo("jumping_jack", "Jumping jack", "Front view · full body visible", "Open arms and feet together, then return to the closed position.")

    def __init__(self) -> None:
        self.width_values: deque[float] = deque(maxlen=5)
        super().__init__()

    def reset(self) -> None:
        super().reset(); self.width_values.clear(); self.phase = "closed"

    def evaluate(self, points: list[object] | None) -> Evaluation:
        ids = (11,12,15,16,23,24,27,28)
        if not points: self.bad_frames = 0; return Evaluation("NO PERSON", False)
        if not self.full_body(points, ids): self.bad_frames = 0; return Evaluation("MOVE FULL BODY INTO FRAME", False)
        shoulder_width = max(distance(points[11], points[12]), .06)
        foot_width = distance(points[27], points[28]) / shoulder_width
        wrist_high = min(points[15].y, points[16].y) < min(points[11].y, points[12].y) - .13
        feet_wide = foot_width > 1.65
        closed = foot_width < 1.05 and max(points[15].y, points[16].y) > max(points[23].y, points[24].y) - .05
        # A jumping jack is intentionally a pure two-position counter. Intermediate
        # frames are normal movement, not bad form: only closed → open → closed
        # completes a repetition.
        if self.phase == "closed" and wrist_high and feet_wide:
            self.phase = "open"
        elif self.phase == "open":
            if closed: self.phase = "closed"; self.finish_rep(False)
        label = "OPEN POSITION" if self.phase == "open" else "CLOSED POSITION"
        return Evaluation(label, False, foot_width, None, "Foot width", "")


class ForwardLungeAnalyzer(Analyzer):
    info = ExerciseInfo("lunge", "Lunge", "Side view · show both feet", "Step forward, bend both knees, then return to standing.")

    def __init__(self) -> None:
        self.knee_values: deque[float] = deque(maxlen=5)
        super().__init__()

    def reset(self) -> None:
        super().reset(); self.knee_values.clear(); self.phase = "up"

    def evaluate(self, points: list[object] | None) -> Evaluation:
        ids = (11,12,23,24,25,26,27,28)
        if not points: self.bad_frames = 0; return Evaluation("NO PERSON", False)
        if not self.full_body(points, ids): self.bad_frames = 0; return Evaluation("MOVE FULL BODY INTO FRAME", False)
        left_knee, right_knee = angle(points[23], points[25], points[27]), angle(points[24], points[26], points[28])
        # In a correct lunge both legs bend. The front and back leg do not need
        # identical angles, so a broad range avoids rejecting natural variation.
        bent_knee = min(left_knee, right_knee)
        self.knee_values.append(bent_knee); bent_knee = float(np.mean(self.knee_values))
        stance = abs(points[27].x - points[28].x)
        in_lunge = stance >= .12
        if not in_lunge:
            self.bad_frames = 0
            return Evaluation("STEP FORWARD INTO A LUNGE", False, bent_knee, None, "Knee", "")
        down = left_knee <= 130 and right_knee <= 130
        up = left_knee >= 150 and right_knee >= 150
        if self.phase == "up" and down:
            self.phase = "down"
        elif self.phase == "down":
            if up:
                self.phase = "up"; self.finish_rep(False)
        return Evaluation("LUNGE POSITION" if self.phase == "down" else "READY: STEP FORWARD", False, bent_knee, None, "Knee", "")


class BicepCurlAnalyzer(Analyzer):
    info = ExerciseInfo("bicep_curl", "Bicep curl", "Front or slight-angle view · show both arms", "Keep an elbow by your side. Curl either hand toward your shoulder, then lower it.")

    def __init__(self) -> None:
        self.left_values: deque[float] = deque(maxlen=5)
        self.right_values: deque[float] = deque(maxlen=5)
        super().__init__()

    def reset(self) -> None:
        super().reset(); self.left_values.clear(); self.right_values.clear(); self.active_arm: str | None = None; self.phase = "ready"

    def evaluate(self, points: list[object] | None) -> Evaluation:
        ids = (11,12,13,14,15,16)
        if not points: self.bad_frames = 0; return Evaluation("NO PERSON", False)
        if not self.full_body(points, ids): self.bad_frames = 0; return Evaluation("SHOW BOTH ARMS", False)
        left = angle(points[11], points[13], points[15])
        right = angle(points[12], points[14], points[16])
        self.left_values.append(left); self.right_values.append(right)
        left, right = float(np.mean(self.left_values)), float(np.mean(self.right_values))

        # The first arm to bend becomes active for the complete repetition. This
        # prevents alternating landmarks from breaking a left- or right-arm curl.
        if self.active_arm is None:
            if left <= 85: self.active_arm, self.phase = "left", "curled"
            elif right <= 85: self.active_arm, self.phase = "right", "curled"
        active_angle = left if self.active_arm == "left" else right
        shoulder = points[11] if self.active_arm == "left" else points[12]
        elbow = points[13] if self.active_arm == "left" else points[14]
        # A curl is still counted if body proportions vary; warning only when the
        # upper arm visibly leaves the side or rises toward the shoulder.
        bad = self.active_arm is not None and (abs(elbow.x - shoulder.x) > .18 or elbow.y < shoulder.y + .04)
        if self.active_arm is not None and self.phase == "curled" and active_angle >= 155:
            self.finish_rep(bad)
            self.active_arm, self.phase = None, "ready"
        if self.active_arm is None:
            return Evaluation("READY: CURL EITHER ARM", False, min(left, right), None, "Elbow", "")
        arm_name = "LEFT" if self.active_arm == "left" else "RIGHT"
        label = "BAD FORM: KEEP ELBOW BY YOUR SIDE" if bad else f"GOOD FORM: CURL {arm_name} ARM"
        return Evaluation(label, self.bad_state(bad), active_angle, None, f"{arm_name.title()} elbow", "")


class HighKneesAnalyzer(Analyzer):
    info = ExerciseInfo(
        "high_knees", "High knees", "Front view · show your full body and both feet",
        "Face the camera. Lift either knee to about a 90° bend, lower it, then lift again. Arms are ignored.",
    )

    def __init__(self) -> None:
        self.left_values: deque[float] = deque(maxlen=5)
        self.right_values: deque[float] = deque(maxlen=5)
        super().__init__()

    def reset(self) -> None:
        super().reset()
        self.left_values.clear(); self.right_values.clear()
        # Each leg must first return to a straight standing position before its
        # next raised-knee position can count. This prevents one held knee from
        # generating several repetitions.
        self.left_armed = self.right_armed = False

    def evaluate(self, points: list[object] | None) -> Evaluation:
        ids = (11, 12, 23, 24, 25, 26, 27, 28)
        if not points:
            self.bad_frames = 0
            return Evaluation("NO PERSON", False)
        if not self.full_body(points, ids):
            self.bad_frames = 0
            return Evaluation("MOVE FULL BODY AND FEET INTO FRAME", False)

        left = angle(points[23], points[25], points[27])
        right = angle(points[24], points[26], points[28])
        self.left_values.append(left); self.right_values.append(right)
        left, right = float(np.mean(self.left_values)), float(np.mean(self.right_values))

        # A straight leg re-arms its own counter. A knee at roughly 90° will
        # pass the 115° threshold, leaving room for normal camera/pose noise.
        if left >= 155: self.left_armed = True
        if right >= 155: self.right_armed = True
        raised: list[str] = []
        if self.left_armed and left <= 115:
            self.left_armed = False; self.finish_rep(False); raised.append("LEFT")
        if self.right_armed and right <= 115:
            self.right_armed = False; self.finish_rep(False); raised.append("RIGHT")

        current = [name for name, value in (("LEFT", left), ("RIGHT", right)) if value <= 115]
        label = f"GOOD FORM: {', '.join(raised or current)} KNEE UP" if (raised or current) else "READY: LIFT A KNEE TO 90°"
        return Evaluation(label, False, min(left, right), None, "Knee", "")


class WallSitAnalyzer(Analyzer):
    uses_timer = True
    info = ExerciseInfo(
        "wall_sit", "Wall sit", "Side view · wall, full body, and feet visible",
        "Keep your back against the wall, thighs level, and knees near 90°. The timer runs only while this position is held.",
    )

    def reset(self) -> None:
        super().reset()
        self.elapsed_seconds = 0.0
        self.hold_started: float | None = None

    def _pause_timer(self) -> None:
        if self.hold_started is not None:
            self.elapsed_seconds += time.monotonic() - self.hold_started
            self.hold_started = None

    def counter_text(self) -> str:
        seconds = self.elapsed_seconds
        if self.hold_started is not None:
            seconds += time.monotonic() - self.hold_started
        whole_seconds = int(seconds)
        return f"TIME  {whole_seconds // 60:02d}:{whole_seconds % 60:02d}"

    def evaluate(self, points: list[object] | None) -> Evaluation:
        if not points:
            self._pause_timer(); self.bad_frames = 0
            return Evaluation("NO PERSON: TIMER PAUSED", False)

        # A side view commonly makes one half of the body clearer. Use whichever
        # shoulder, hip, knee, and ankle set MediaPipe can see reliably.
        side = None
        for indices in ((11, 23, 25, 27), (12, 24, 26, 28)):
            candidate = [points[index] for index in indices]
            if all(getattr(point, "visibility", 1.0) >= .55 for point in candidate):
                side = candidate
                break
        if side is None:
            self._pause_timer(); self.bad_frames = 0
            return Evaluation("TURN SIDEWAYS: SHOW ONE FULL LEG", False)

        shoulder, hip, knee_point, ankle = side
        knee = angle(hip, knee_point, ankle)
        hip_angle = angle(shoulder, hip, knee_point)
        torso_length = max(distance(shoulder, hip), .05)
        torso_is_vertical = abs(shoulder.x - hip.x) / torso_length <= .35
        # A wall sit has a roughly horizontal thigh and vertical lower leg, so
        # the knee and hip are both close to 90°. Broad bounds accommodate normal
        # body proportions and the small perspective error in a home camera.
        holding = 72 <= knee <= 118 and 68 <= hip_angle <= 122 and torso_is_vertical
        if holding:
            if self.hold_started is None:
                self.hold_started = time.monotonic()
        else:
            self._pause_timer()

        label = "GOOD FORM: WALL SIT" if holding else "GET INTO WALL-SIT POSITION"
        return Evaluation(label, False, knee, hip_angle, "Knee", "Hip")


EXERCISES: dict[str, type[Analyzer]] = {
    "pushup": PushUpAnalyzer,
    "squat": SquatAnalyzer,
    "jumping_jack": JumpingJackAnalyzer,
    "lunge": ForwardLungeAnalyzer,
    "bicep_curl": BicepCurlAnalyzer,
    "high_knees": HighKneesAnalyzer,
    "wall_sit": WallSitAnalyzer,
}
