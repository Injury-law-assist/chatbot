import io, { Socket } from "socket.io-client";
import readline from "readline";

const socket: Socket = io("http://localhost:3000");

interface QuestionMessage {
    sender: string;
    question: string;
}

interface AnswerMessage {
    sender: string;
    answer: string;
}

// readline 인터페이스 생성
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

// 서버로부터 메시지 수신 처리
socket.on("connect", () => {
    console.log(`Connected with ID: ${socket.id}`);

    // 특정 방에 참여
    const roomId = 2; // 예제 방 번호, 서버에서 설정한 방 번호와 맞아야 합니다.
    socket.emit("join room", roomId);

    // 서버로부터 메시지 수신 처리
    socket.on("chat message", (data) => {
        console.log(`${data.msg.sender}: ${data.msg.answer}`);
    });

    // 사용자 입력을 받아 서버로 메시지 전송
    async function sendMessage() {
        rl.question("Enter your message: ", (message: string) => {
            const sender = "Node Client";
            const questionMessage: QuestionMessage = { sender, question: message };

            // 서버로 메시지 전송
            socket.emit("chat message", { roomId, msg: questionMessage });

            // 다음 메시지 입력 대기
            sendMessage();
        });
    }

    // 시작
    sendMessage();

    // Ctrl+C 처리
    rl.on("SIGINT", () => {
        rl.close();
        socket.disconnect();
        process.exit(0);
    });
});

// 서버와 연결이 끊어졌을 때
socket.on("disconnect", () => {
    console.log("Disconnected from server");
});
