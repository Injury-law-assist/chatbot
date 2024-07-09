const fs = require("fs");
const path = require("path");

// JSON Lines 파일 생성 함수
async function createJsonLinesFile(inputFilePath, outputFilePath) {
    // 파일 읽기
    fs.readFile(inputFilePath, "utf8", (err, data) => {
        if (err) {
            console.error("Error reading file:", err);
            return;
        }

        try {
            const jsonData = JSON.parse(data); // JSON 문자열을 JavaScript 객체로 변환
            const jsonLines = [];

            for (const item of jsonData) {
                const question = [];
                question.push(`${item.accnum}의 ${item.title} 에 대해서 ${item.kindc} 인 경우에 대해서 알려줘.`);
                question.push(`${item.accnum}의 ${item.title} 에 대해서 ${item.kindc} 인 경우는?`);
                // question.push(`${item.accnum}의 ${item.title} 에 대해서 ${item.kindc} 인 경우가 뭐야?`);

                //question.push(`${item.title} 에 대해서 ${item.kindc} 인 경우에 대해서 알려줘.`);
                //question.push(`${item.title} 에 대해서 ${item.kindc} 인 경우는?`);
                // question.push(`${item.title} 에 대해서 ${item.kindc} 인 경우가 뭐야?`);

                for (const q of question) {
                    const element = {
                        messages: [
                            {
                                role: "system",
                                content:
                                    "You are a chatbot that provides predictions on workers' compensation judgments. Your goal is to always respond kindly and thoroughly, helping to determine the feasibility and direction of resolving current cases based on previous precedents.",
                            },
                            {
                                role: "user",
                                content: q,
                            },
                            {
                                role: "assistant",
                                content: `${item.accnum} 에 대해서 설명 드리겠습니다. ${item.noncontent}`,
                            },
                        ],
                    };
                    jsonLines.push(JSON.stringify(element)); // 각 객체를 JSON 문자열로 변환하여 배열에 추가
                }
            }

            // JSON Lines 파일로 쓰기
            fs.writeFile(outputFilePath, jsonLines.join("\n"), "utf8", (err) => {
                if (err) {
                    console.error("Error writing file:", err);
                    return;
                }
                console.log(`JSON Lines 파일이 생성되었습니다: ${outputFilePath}`);
            });
        } catch (err) {
            console.error("Error parsing JSON:", err);
        }
    });
}

/** upload */
async function loadTrainFile() {
    let file = await openai.files.create({
        file: fs.createReadStream("./out/output.jsonl"),
        purpose: "fine-tune",
    });
    return file.id;
}

/** upload */
async function startFineTuning(fileId) {
    let fineTune = await openai.fineTuning.jobs.create({
        model: "gpt-3.5-turbo",
        training_file: fileId,
        hyperparameters: {
            n_epochs: 1,
        },
    });
    console.log(fineTune);
    return fineTune.id;
}
async function getStatusForFineTuning(jobId) {
    let fineTune = await openai.fineTuning.jobs.retrieve(jobId);
    console.log(fineTune);

    let events = await openai.fineTuning.jobs.listEvents(fineTune.id, { limit: 10 });
    console.log(events);
}

async function main() {
    const filePath = path.join(__dirname, "./train_data/subresult_1.json"); // 입력 파일 경로 설정
    const outputFilePath = path.join(__dirname, "./out/output.jsonl"); // 출력 파일 경로 설정

    await createJsonLinesFile(filePath, outputFilePath);
    const fileId = await loadTrainFile();
    const jobId = await startFineTuning(fileId);
    await getStatusForFineTuning(jobId);
}
