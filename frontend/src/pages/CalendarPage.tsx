import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { Event, Schedule } from '../types';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const DAYS_HEADER = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<Event[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [tab, setTab] = useState<'calendar' | 'events'>('calendar');

  useEffect(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const start = new Date(year, month, 1).toISOString().split('T')[0];
    const end = new Date(year, month + 1, 0).toISOString().split('T')[0];
    api.get<any>(`/events?start_date=${start}&end_date=${end}`).then(data => setEvents(data.events));
    api.get<any>('/schedules').then(data => setSchedules(data.schedules));
  }, [currentDate]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();

  const calendarDays: { day: number; isCurrentMonth: boolean }[] = [];
  const prevMonthDays = new Date(year, month, 0).getDate();
  for (let i = firstDay - 1; i >= 0; i--) calendarDays.push({ day: prevMonthDays - i, isCurrentMonth: false });
  for (let i = 1; i <= daysInMonth; i++) calendarDays.push({ day: i, isCurrentMonth: true });
  const remaining = 42 - calendarDays.length;
  for (let i = 1; i <= remaining; i++) calendarDays.push({ day: i, isCurrentMonth: false });

  const getEventsForDay = (day: number) => {
    if (!day) return [];
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return events.filter(e => {
      if (e.start_date <= dateStr && (!e.end_date || e.end_date >= dateStr)) return true;
      return e.start_date === dateStr;
    });
  };

  const getDaySchedule = (day: number) => {
    const date = new Date(year, month, day);
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayName = dayNames[date.getDay()];
    return schedules.filter(s => s.day_of_week === dayName).slice(0, 2);
  };

  return (
    <div>
      <div className="tabs">
        <button className={`tab ${tab === 'calendar' ? 'active' : ''}`} onClick={() => setTab('calendar')}>Calendar</button>
        <button className={`tab ${tab === 'events' ? 'active' : ''}`} onClick={() => setTab('events')}>Events List</button>
      </div>

      {tab === 'calendar' && (
        <div className="card">
          <div className="card-header">
            <button className="btn btn-secondary btn-sm" onClick={() => setCurrentDate(new Date(year, month - 1))}>
              <ChevronLeft size={16} />
            </button>
            <span className="card-title">
              {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </span>
            <button className="btn btn-secondary btn-sm" onClick={() => setCurrentDate(new Date(year, month + 1))}>
              <ChevronRight size={16} />
            </button>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            <div className="calendar-grid">
              {DAYS_HEADER.map(d => <div key={d} className="calendar-header">{d}</div>)}
              {calendarDays.map((cd, i) => {
                const isToday = cd.isCurrentMonth && cd.day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
                const dayEvents = cd.isCurrentMonth ? getEventsForDay(cd.day) : [];
                const daySchedules = cd.isCurrentMonth ? getDaySchedule(cd.day) : [];

                return (
                  <div key={i} className={`calendar-day ${isToday ? 'today' : ''} ${!cd.isCurrentMonth ? 'other-month' : ''}`}>
                    <div className="calendar-day-number" style={isToday ? { color: 'var(--primary)', fontWeight: 700 } : {}}>
                      {cd.day}
                    </div>
                    {dayEvents.map(e => (
                      <div key={e.id} className={`calendar-event ${e.event_type}`}>
                        {e.title}
                      </div>
                    ))}
                    {daySchedules.map(s => (
                      <div key={s.id} className="calendar-event class">
                        {s.start_time} {s.subject_name}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {tab === 'events' && (
        <div className="card">
          <div className="card-header"><span className="card-title">All Events</span></div>
          <div className="table-container">
            <table>
              <thead><tr><th>Event</th><th>Type</th><th>Start</th><th>End</th><th>Created By</th></tr></thead>
              <tbody>
                {events.map(e => (
                  <tr key={e.id}>
                    <td style={{ fontWeight: 500 }}>{e.title}</td>
                    <td><span className={`badge ${e.event_type === 'exam' ? 'badge-red' : e.event_type === 'holiday' ? 'badge-green' : 'badge-blue'}`}>{e.event_type}</span></td>
                    <td>{new Date(e.start_date).toLocaleDateString()}</td>
                    <td>{e.end_date ? new Date(e.end_date).toLocaleDateString() : '-'}</td>
                    <td>{e.created_by_name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
