import Bull from "bull";
import http from "http";
import { Server, Socket } from "socket.io";
import Container from "typedi";
import ChatService from "../services/chat";
import { AnswerMessage, QuestionMessage } from "../types/Message";

export function init(server: http.Server) {
    const io = new Server(server);

    io.on("connection", (socket: Socket) => {
        const queue: Bull.Queue = Container.get("chatQueue");
        const chatService: ChatService = Container.get(ChatService);
        console.log(queue, chatService);
        console.log("user connected");
        socket.on("chat message", async ({ roomId, msg }: { roomId: number; msg: QuestionMessage }) => {
            console.log("message: " + msg.question);
            // const answer = await chatService.askQuestion(msg.question);
            const answerMessage: AnswerMessage = {
                sender: "bot",
                answer: "a",
            };
            io.emit("chat message", { roomId, answerMessage }); // Broadcast the message to all connected clients
        });

        socket.on("disconnect", () => {
            console.log("user disconnected");
        });
    });
}
