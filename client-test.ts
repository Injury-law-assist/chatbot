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

/**
 * @description
 * 이 부분은 서버로 부터 답변을 받을 때 이벤트를 발생 시킨다.
 */
socket.on("chat message", (msg: AnswerMessage) => {
    console.log(`${msg.sender}: ${msg.answer}`);
});
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

async function sendMessage() {
    rl.question("Enter your message: ", (message: string) => {
        const sender = "Node Client"; // user 이름 / user Id 뭘로 할지는 아직 못정함
        const questionMessage: QuestionMessage = { sender, question: message };

        /**
         * NOTE: 아래가 보내는 코드는
         * server로 보내는 코드
         * */
        socket.emit("chat message", questionMessage);

        sendMessage();
        //반복해서 입력 받기 <-- client에 들어갈 때는 필요없음
    });
}
(async function main() {
    await sendMessage();

    rl.on("SIGINT", () => {
        rl.close();
        socket.disconnect();
        process.exit(0);
    });
})();
