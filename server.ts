import http from "http";
import { Server, Socket } from "socket.io";
import OpenAI from "openai";
import { config } from "dotenv";
import { AnswerMessage, QuestionMessage } from "./types/Message";
config();
const server = http.createServer();
const openai = new OpenAI({
    apiKey: process.env.API_KEY,
});

async function askQuestion(question: string): Promise<string> {
    try {
        const completion = await openai.chat.completions.create({
            model: "ft:gpt-3.5-turbo-0125:personal::9jiz7x0F",
            messages: [{ role: "user", content: question }],
        });
        console.log(completion);

        return completion.choices[0].message.content as string;
    } catch (error) {
        console.error("Failed to generate response:", error);
        return "Sorry, I couldn't process your request at the moment.";
    }
}
const io = new Server(server);

io.on("connection", (socket: Socket) => {
    console.log("a user connected");
    socket.on("chat message", async (msg: QuestionMessage) => {
        console.log("message: " + msg.question);
        const answer = await askQuestion(msg.question);
        const result: AnswerMessage = {
            sender: "bot",
            answer: answer,
        };
        io.emit("chat message", result); // Broadcast the message to all connected clients
    });

    socket.on("disconnect", () => {
        console.log("user disconnected");
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
