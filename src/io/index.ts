import Bull from "bull";
import http from "http";
import { Server, Socket } from "socket.io";
import { Container } from "typedi";
import ChatService from "../services/chat";
import { AnswerMessage, QuestionMessage } from "../types/Message";
import ChatRoomInfo from "../types/Chat";
import Redis from "ioredis";

export function init(server: http.Server) {
    const io = new Server(server, {
        path: "/bot",
        cors: {
            origin: "*",
            methods: ["GET", "POST"],
            credentials: true,
        },
    });
    const queue: Bull.Queue = Container.get("chatQueue");
    const chatService: ChatService = Container.get(ChatService);
    const redis = new Redis({
        host: "redis",
        port: 6379,
    });
    queue.process("save message", async (job) => {
        const chatInfo = job.data as { roomId: number; userId: number; question: string; answer: string };
        await chatService.createMessage({ chatInfo });
        await redis.set(`room-${chatInfo.roomId}-previous-msg`, JSON.stringify({ question: chatInfo.question, answer: chatInfo.answer }));
    });
    io.on("connection", async (socket: Socket) => {
        let chatRoomInfo: ChatRoomInfo | null = null;
        console.log("user connected");

        // 클라이언트가 특정 방에 참가하도록 설정
        /**
         * 이전 대화 기록을 가지고 온다.
         */
        socket.on("join room", async (roomId: number) => {
            socket.join(`room-${roomId}`);
            console.log(`Client ${socket.id} joined room ${roomId} `);
            const { u_id, cr_name, u_nickname } = await chatService.getChatRoomInfo({ roomId });
            const previousMessage: { question: string; answer: string } = await chatService.getPreviousMessage({ roomId });
            console.log(previousMessage);
            await redis.set(`room-${roomId}-previous-msg`, JSON.stringify(previousMessage));
            chatRoomInfo = {
                userId: u_id,
                chatRoomName: cr_name,
                nickName: u_nickname,
            };
        });

        // 방에 있는 클라이언트에게 메시지 전송
        socket.on("chat message", async ({ roomId, msg }: { roomId: number; msg: QuestionMessage }) => {
            try {
                if (!chatRoomInfo) throw new Error("cannot access");
                if (!msg) throw new Error("plz add msg");
                const previousMessage: string | null = await redis.get(`room-${roomId}-previous-msg`);

                const answer = await chatService.askQuestion(previousMessage, msg.question);

                const answerMessage: AnswerMessage = {
                    sender: chatRoomInfo.chatRoomName,
                    answer: answer,
                };
                // 특정 방에 있는 모든 클라이언트에게 메시지 보내기
                io.to(`room-${roomId}`).emit("chat message", { roomId, answerMessage: answerMessage });
                await queue.add("save message", {
                    roomId,
                    userId: chatRoomInfo.userId,
                    question: msg.question,
                    answer: answerMessage.answer,
                });
            } catch (err) {
                io.to(`room-${roomId}`).emit("chat message", { err: "failed send message" });
            }
        });

        socket.on("disconnect", () => {
            console.log("user disconnected");
        });
    });
}
