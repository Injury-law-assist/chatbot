import Bull from "bull";
import http from "http";
import { Server, Socket } from "socket.io";
import Container from "typedi";
import ChatService from "../services/chat";
import { AnswerMessage, QuestionMessage } from "../types/Message";
import { Pool } from "mysql2/promise";
import ChatRoomInfo from "../types/Chat";

export function init(server: http.Server) {
    const io = new Server(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"],
            credentials: true,
        },
    });

    io.on("connection", async (socket: Socket) => {
        const queue: Bull.Queue = Container.get("chatQueue");
        const chatService: ChatService = Container.get(ChatService);
        const pool: Pool = Container.get("pool");
        let chatRoomInfo: ChatRoomInfo | null = null;
        console.log("user connected");

        // 클라이언트가 특정 방에 참가하도록 설정
        socket.on("join room", async (roomId: number) => {
            socket.join(`room-${roomId}`);
            console.log(`Client ${socket.id} joined room ${roomId} `);

            const connection = await pool.getConnection();
            try {
                const sql = `SELECT u_id, u_nickname, cr.title AS cr_name 
                    FROM chatRooms cr, users u 
                    WHERE cr.u_id = u.u_id AND cr.cr_id = ? 
                    LIMIT 1`;
                const [result] = (await connection.query(sql, [roomId])) as [{ u_id: number; cr_name: string; u_nickname: string }[], any];

                if (result && result.length > 0) {
                    const { u_id, cr_name, u_nickname } = result[0];
                    chatRoomInfo = {
                        userId: u_id,
                        chatRoomName: cr_name,
                        nickName: u_nickname,
                    };
                } else {
                    console.error(`No chat room found for roomId ${roomId}`);
                }
            } catch (error) {
                console.error("Error fetching chat room info:", error);
            } finally {
                connection.release();
            }
        });

        // 방에 있는 클라이언트에게 메시지 전송
        socket.on("chat message", async ({ roomId, msg }: { roomId: number; msg: QuestionMessage }) => {
            if (!chatRoomInfo) throw new Error("cannot access");
            const answer = await chatService.askQuestion(msg.question);

            const answerMessage: AnswerMessage = {
                sender: chatRoomInfo.chatRoomName,
                answer: answer,
            };
            // 특정 방에 있는 모든 클라이언트에게 메시지 보내기
            io.to(`room-${roomId}`).emit("chat message", { roomId, answerMessage: answerMessage });
            await queue.add("process message", {
                roomId,
                userId: chatRoomInfo.userId,
                question: answerMessage.answer,
            });
        });

        queue.process("process message", async (job) => {
            const { roomId, userId, question } = job.data as { roomId: number; userId: number; question: string };

            const pool: Pool = Container.get("pool");
            const connection = await pool.getConnection();

            try {
                // 메시지 데이터베이스에 저장
                await connection.query(`INSERT INTO messages (cr_id, u_id, m_content) VALUES (?, ?, ?)`, [roomId, userId, question]);

                console.log(`Message from room ${roomId} saved to database.`);
            } catch (error) {
                console.error("Error saving message to database:", error);
            } finally {
                connection.release();
            }
        });

        socket.on("disconnect", () => {
            console.log("user disconnected");
        });
    });
}
