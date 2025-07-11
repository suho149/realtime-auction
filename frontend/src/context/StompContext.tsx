// src/context/StompContext.tsx

import React, { createContext, useContext, useEffect, useRef, ReactNode } from 'react';
import { Client, IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { getCookieValue } from '../utils/cookie';

interface StompContextType {
    client: Client | null;
    connected: boolean;
    publish: (destination: string, body: object) => void;
    subscribe: (topic: string, callback: (message: IMessage) => void) => string | null;
    unsubscribe: (id: string) => void;
}

const StompContext = createContext<StompContextType | null>(null);

export const StompProvider = ({ children }: { children: ReactNode }) => {
    const clientRef = useRef<Client | null>(null);
    const [connected, setConnected] = React.useState(false);
    const subscriptions = useRef(new Map<string, string>());

    useEffect(() => {
        const accessToken = getCookieValue('access_token');
        const client = new Client({
            webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
            connectHeaders: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
            debug: (str) => { console.log(new Date(), str); },
            reconnectDelay: 5000,
            onConnect: () => {
                setConnected(true);
                console.log('STOMP 연결 성공!');
            },
            onDisconnect: () => {
                setConnected(false);
                console.log('STOMP 연결 끊김.');
            },
        });

        client.activate();
        clientRef.current = client;

        return () => {
            client.deactivate();
        };
    }, []);

    const publish = (destination: string, body: object) => {
        if (connected && clientRef.current) {
            clientRef.current.publish({ destination, body: JSON.stringify(body) });
        }
    };

    const subscribe = (topic: string, callback: (message: IMessage) => void) => {
        if (connected && clientRef.current) {
            const subscription = clientRef.current.subscribe(topic, callback);
            subscriptions.current.set(topic, subscription.id);
            return subscription.id;
        }
        return null;
    };

    const unsubscribe = (id: string) => {
        if (connected && clientRef.current) {
            clientRef.current.unsubscribe(id);
        }
    };

    return (
        <StompContext.Provider value={{ client: clientRef.current, connected, publish, subscribe, unsubscribe }}>
            {children}
        </StompContext.Provider>
    );
};

export const useStompContext = () => {
    const context = useContext(StompContext);
    if (!context) {
        throw new Error('useStompContext must be used within a StompProvider');
    }
    return context;
};