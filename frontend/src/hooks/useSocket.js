import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

export default function useSocket({ url, warehouseId } = {}) {
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [events, setEvents] = useState([]);

  useEffect(() => {
    if (!url) return;
    const socket = io(url, { transports: ['websocket','polling'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      if (warehouseId) socket.emit('join-warehouse', warehouseId);
    });

    socket.on('disconnect', () => setConnected(false));

    socket.on('stock:changed', data => {
      setEvents(e => [{ type: 'stock:changed', data, time: Date.now() }, ...e].slice(0, 50));
    });
    socket.on('stock:changed:global', data => {
      setEvents(e => [{ type: 'stock:changed:global', data, time: Date.now() }, ...e].slice(0, 50));
    });
    socket.on('stock:low', data => {
      setEvents(e => [{ type: 'stock:low', data, time: Date.now() }, ...e].slice(0, 50));
    });
    socket.on('connect_error', err => console.error('Socket connect_error', err));

    return () => socket.disconnect();
  }, [url, warehouseId]);

  return { socket: socketRef.current, connected, events };
}
