"use client";

import type { StudyRoom } from "@/types/room";
import { ArrowUpRight, BookOpen, Clock3, Headphones, Sparkles, Users, Zap } from "lucide-react";

const moodIcons = {
  cozy: Sparkles,
  focus: Clock3,
  sprint: Zap,
  quiet: BookOpen,
};

interface StudyRoomCardProps {
  room: StudyRoom;
  /** Opens the guidelines gate; navigation happens only after confirmation. */
  onEnter: (room: StudyRoom, trigger: HTMLButtonElement) => void;
}

export function StudyRoomCard({ room, onEnter }: StudyRoomCardProps) {
  const MoodIcon = moodIcons[room.mood as keyof typeof moodIcons] || Headphones;

  return (
    <article className={`room-card room-card-${room.color}`}>
      <div className="room-card-content">
        <div className="room-card-meta">
          <span className="room-mood">
            <MoodIcon size={13} /> {room.mood}
          </span>
          <span className="room-seat-count">
            <Users size={13} /> {room.participants}/{room.capacity} seats
          </span>
        </div>
        <div>
          <h2>{room.name}</h2>
          <p className="room-topic">{room.topic}</p>
          <p className="room-desc">{room.description}</p>
        </div>
        <div className="room-tags">
          {room.tags.map((tag) => (
            <span key={tag} className="room-tag-pill">{tag}</span>
          ))}
        </div>
        <button
          type="button"
          className="room-join-btn"
          onClick={(event) => onEnter(room, event.currentTarget)}
          aria-haspopup="dialog"
          aria-label={`Enter ${room.name} study room`}
        >
          <span>Enter study room</span>
          <ArrowUpRight size={16} aria-hidden="true" />
        </button>
      </div>

      <div className="room-card-art cozy-wallpaper-pattern">
        <div className="room-art-badge">
          {room.minutes}m session
        </div>
        <div className="room-art-avatars">
          <div className="mini-avatar-stack">
            <span>{room.host[0]}</span>
            <span>N</span>
          </div>
          <small>Host: {room.host}</small>
        </div>
      </div>
    </article>
  );
}
