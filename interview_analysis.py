def get_interview_score(emotion):

    scores = {
        "happy": 90,
        "neutral": 80,
        "sad": 60,
        "fearful": 50,
        "angry": 55
    }

    return scores.get(emotion, 70)


def get_confidence(emotion):

    confidence = {
        "happy": 85,
        "neutral": 80,
        "sad": 65,
        "fearful": 55,
        "angry": 60
    }

    return confidence.get(emotion, 70)


def get_status(score):

    if score >= 80:
        return "Ready for Interview"

    elif score >= 60:
        return "Needs More Practice"

    else:
        return "Requires Improvement"


def get_communication_score(emotion):

    scores = {
        "happy": 88,
        "neutral": 80,
        "sad": 65,
        "fearful": 55,
        "angry": 60
    }

    return scores.get(emotion, 70)


def get_feedback(emotion):

    if emotion == "happy":
        return "Good confidence and positive attitude"

    elif emotion == "neutral":
        return "Calm communication but can be more expressive"

    elif emotion == "fearful":
        return "Appears nervous during communication"

    elif emotion == "sad":
        return "Needs more enthusiasm while speaking"

    elif emotion == "angry":
        return "Needs better emotional control"

    return "Average communication"


def get_emoji(emotion):

    emojis = {
        "happy": "😊",
        "neutral": "😐",
        "sad": "😔",
        "fearful": "😨",
        "angry": "😠"
    }

    return emojis.get(emotion, "🙂")