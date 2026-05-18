import pandas as pd
from django.utils import timezone
from sessions.models import StudySession

def get_user_study_profile(user):
    """
    Kullanıcının veritabanındaki StudySession verilerini kullanarak
    Pandas ile profil analizi yapar. 
    Eğer yeterli veri yoksa default profil döndürür.
    """
    # Fetch all study sessions with duration > 0
    sessions = StudySession.objects.filter(user=user, actual_duration_seconds__gt=0)
    
    if not sessions.exists():
        # Default profile if no data
        return {
            "daily_average_minutes": 90,
            "best_focus_hours": ["10:00-12:00", "14:00-16:00"],
            "course_distribution": {},
            "completed_pomodoros": 0,
            "break_ratio": 0.2
        }

    # Extract data into list of dicts for Pandas
    data = list(sessions.values(
        'session_type', 'title', 'actual_duration_seconds', 'started_at', 'completed'
    ))
    
    df = pd.DataFrame(data)
    
    # 1. Completed Pomodoros (Only truly completed ones)
    pomodoro_count = df[(df['session_type'] == 'pomodoro') & (df['completed'] == True)].shape[0] if 'completed' in df.columns else 0
    
    # 2. Daily Average Minutes
    # Add a date column
    df['date'] = df['started_at'].dt.date
    # Group by date and sum duration, then take mean over days
    daily_durations = df[df['session_type'].isin(['pomodoro', 'stopwatch'])].groupby('date')['actual_duration_seconds'].sum()
    daily_average_minutes = (daily_durations.mean() / 60) if not daily_durations.empty else 0
    daily_average_minutes = int(daily_average_minutes)

    # 3. Course Distribution
    study_df = df[df['session_type'].isin(['pomodoro', 'stopwatch'])]
    course_distribution = {}
    if not study_df.empty:
        # Sum seconds per title
        course_grouped = study_df.groupby('title')['actual_duration_seconds'].sum()
        total_study_seconds = study_df['actual_duration_seconds'].sum()
        if total_study_seconds > 0:
            course_percentages = (course_grouped / total_study_seconds) * 100
            course_distribution = course_percentages.round(1).to_dict()

    # 4. Best Focus Hours
    # Using started_at hour to find most active time of day
    best_focus_hours = []
    if not study_df.empty:
        df['hour'] = df['started_at'].dt.hour
        most_active_hour = df[df['session_type'].isin(['pomodoro', 'stopwatch'])]['hour'].mode()
        if not most_active_hour.empty:
            hour = most_active_hour.iloc[0]
            end_hour = (hour + 2) % 24
            best_focus_hours = [f"{hour:02d}:00-{end_hour:02d}:00"]

    if not best_focus_hours:
        best_focus_hours = ["10:00-12:00"]

    # 5. Break Ratio
    total_study = study_df['actual_duration_seconds'].sum()
    total_break = df[df['session_type'].isin(['short_break', 'long_break'])]['actual_duration_seconds'].sum()
    
    break_ratio = 0.2
    if total_study > 0:
        break_ratio = total_break / total_study
        
    # 6. Total Days and Hours
    total_days = daily_durations.shape[0] if not daily_durations.empty else 0
    total_seconds = study_df['actual_duration_seconds'].sum() if not study_df.empty else 0
    total_hours = round(total_seconds / 3600, 1)

    return {
        "daily_average_minutes": daily_average_minutes or 90,
        "best_focus_hours": best_focus_hours,
        "course_distribution": course_distribution,
        "completed_pomodoros": pomodoro_count,
        "break_ratio": round(break_ratio, 2),
        "total_days": total_days,
        "total_hours": total_hours
    }
