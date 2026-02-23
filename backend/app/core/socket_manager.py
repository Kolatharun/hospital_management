"""
Socket.IO Manager - Real-time communication for queue updates

Provides real-time updates to TV displays and front office dashboards
when queue state changes (patient called, completed, etc.)

Events:
- queue_updated: Emitted when queue state changes (call, complete, cancel, etc.)
- patient_called: Emitted when a specific patient is called

Usage:
    from app.core.socket_manager import socket_manager

    # Emit queue update to all clients
    await socket_manager.emit_queue_updated(doctor_id="uuid-here")

    # Emit patient called event
    await socket_manager.emit_patient_called(appointment_id="uuid-here", patient_name="John Doe")
"""

import socketio
from typing import Optional, Dict, Any
from uuid import UUID


# Create Socket.IO server with ASGI mode
# async_mode='asgi' is required for FastAPI integration
sio = socketio.AsyncServer(
    async_mode='asgi',
    cors_allowed_origins='*',  # Will be restricted by FastAPI CORS middleware
    logger=True,
    engineio_logger=False,
)


class SocketManager:
    """
    Manager class for Socket.IO operations.

    Provides typed methods for emitting events and handling connections.
    """

    def __init__(self, server: socketio.AsyncServer):
        self.server = server
        self._setup_event_handlers()

    def _setup_event_handlers(self) -> None:
        """Set up Socket.IO event handlers."""

        @self.server.event
        async def connect(sid: str, environ: dict):
            """Handle client connection."""
            print(f"[Socket.IO] Client connected: {sid}")

        @self.server.event
        async def disconnect(sid: str):
            """Handle client disconnection."""
            print(f"[Socket.IO] Client disconnected: {sid}")

        @self.server.event
        async def join_queue(sid: str, data: dict):
            """
            Join a doctor-specific queue room for targeted updates.

            Args:
                data: {"doctor_id": "uuid-string"} or {"room": "global"}
            """
            room = data.get('doctor_id') or data.get('room', 'global')
            await self.server.enter_room(sid, room)
            print(f"[Socket.IO] Client {sid} joined room: {room}")

        @self.server.event
        async def leave_queue(sid: str, data: dict):
            """Leave a queue room."""
            room = data.get('doctor_id') or data.get('room', 'global')
            await self.server.leave_room(sid, room)
            print(f"[Socket.IO] Client {sid} left room: {room}")

    async def emit_queue_updated(
        self,
        doctor_id: Optional[str] = None,
        data: Optional[Dict[str, Any]] = None,
    ) -> None:
        """
        Emit queue_updated event.

        This event signals that the queue has changed and clients should refresh.

        Args:
            doctor_id: If provided, emit to doctor-specific room. Otherwise, emit globally.
            data: Optional additional data to send with the event.
        """
        event_data = {
            "event": "queue_updated",
            "doctor_id": doctor_id,
            **(data or {})
        }

        if doctor_id:
            # Emit to doctor-specific room
            await self.server.emit('queue_updated', event_data, room=doctor_id)

        # Always emit to global room (TV displays listen here)
        await self.server.emit('queue_updated', event_data, room='global')

        print(f"[Socket.IO] Emitted queue_updated: doctor_id={doctor_id}")

    async def emit_patient_called(
        self,
        appointment_id: str,
        patient_name: str,
        op_number: str,
        room_number: Optional[str] = None,
        doctor_id: Optional[str] = None,
    ) -> None:
        """
        Emit patient_called event for TV display voice announcement.

        Args:
            appointment_id: The appointment UUID
            patient_name: Patient's full name
            op_number: OP number for display
            room_number: Consultation room number
            doctor_id: Doctor's UUID for targeted emission
        """
        event_data = {
            "event": "patient_called",
            "appointment_id": appointment_id,
            "patient_name": patient_name,
            "op_number": op_number,
            "room_number": room_number,
            "doctor_id": doctor_id,
        }

        # Emit to global room (all TV displays)
        await self.server.emit('patient_called', event_data, room='global')

        if doctor_id:
            await self.server.emit('patient_called', event_data, room=doctor_id)

        print(f"[Socket.IO] Emitted patient_called: {patient_name} ({op_number})")


# Create singleton instance
socket_manager = SocketManager(sio)

# Create ASGI app for mounting
socket_app = socketio.ASGIApp(sio)
