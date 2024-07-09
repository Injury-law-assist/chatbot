const OpenAI = require("openai");
const readline = require("readline");
require("dotenv").config();
const openai = new OpenAI({
    apiKey: process.env.API_KEY,
});

async function askQuestion(question) {
    try {
        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo-0125",
            messages: [{ role: "user", content: question }],
        });
        console.log(completion);

        return completion.choices[0].message.content;
    } catch (error) {
        console.error("Failed to generate response:", error);
        return "Sorry, I couldn't process your request at the moment.";
    }
}

async function main() {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    function ask() {
        rl.question("질문을 입력하세요 (종료하려면 'exit' 입력): ", async (question) => {
            if (question.toLowerCase() === "exit") {
                console.log("프로그램을 종료합니다.");
                rl.close();
                return;
            }

            // 질문을 모델에 전달하고 응답 받기
            const answer = await askQuestion(question);

            // 출력
            console.log("Question:", question);
            console.log("Answer:", answer);

            // 다시 질문
            ask();
        });
    }

    ask();
}

main();
