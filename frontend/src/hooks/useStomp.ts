// src/hooks/useStomp.ts
import { useEffect, useRef } from 'react';
import { Client, IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { getCookieValue } from '../utils/cookie';

interface UseStompParams {
    topic: string;
    onMessage: (message: IMessage) => void;
}

export const useStomp = ({ topic, onMessage }: UseStompParams) => {
    const clientRef = useRef<Client | null>(null);

    useEffect(() => {
        if (!topic) return;

        const accessToken = getCookieValue('access_token');
        const client = new Client({
            webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
            connectHeaders: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
            debug: (str) => { console.log(new Date(), str); },
            reconnectDelay: 5000,
        });

        client.onConnect = () => {
            console.log(`WebSocket 연결 성공! 토픽 구독: ${topic}`);
            client.subscribe(topic, onMessage);
        };

        client.onStompError = (frame) => { console.error('STOMP 에러:', frame); };
        client.activate();
        clientRef.current = client;

        // 컴포넌트 언마운트 시 연결 해제
        return () => {
            if (clientRef.current) {
                clientRef.current.deactivate();
                console.log('WebSocket 연결 해제.');
            }
        };
    }, [topic, onMessage]); // topic이나 onMessage 콜백이 바뀔 때 재연결

    const publish = (destination: string, body: object) => {
        if (clientRef.current?.connected) {
            clientRef.current.publish({
                destination,
                body: JSON.stringify(body),
            });
        } else {
            console.error("STOMP 클라이언트가 연결되지 않았습니다.");
        }
    };

    return { publish };
};