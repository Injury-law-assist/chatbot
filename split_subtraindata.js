const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "result.json"); // result.json 파일 경로 설정

// 파일 읽기
fs.readFile(filePath, "utf8", (err, data) => {
    if (err) {
        console.error("Error reading file:", err);
        return;
    }

    try {
        const jsonData = JSON.parse(data); // JSON 문자열을 JavaScript 객체로 변환

        let allItems = []; // 모든 요소를 저장할 배열

        // 최상위 배열을 순회하면서 요소들을 모두 모아 저장
        for (const item of jsonData) {
            if (Array.isArray(item)) {
                // 내부 배열이 있는 경우
                allItems = allItems.concat(item); // 내부 배열의 요소들을 모두 추가
            } else {
                // 내부 배열이 없는 경우
                allItems.push(item); // 요소를 바로 추가
            }
        }

        // 서브 JSON 파일 생성
        const batchSize = 1000; // 각 파일에 저장할 데이터의 개수
        const numBatches = Math.ceil(allItems.length / batchSize); // 필요한 서브 JSON 파일의 개수

        for (let i = 0; i < numBatches; i++) {
            const startIndex = i * batchSize;
            const endIndex = Math.min(startIndex + batchSize, allItems.length);
            const batch = allItems.slice(startIndex, endIndex); // batchSize 만큼 데이터를 자름

            const subJsonData = JSON.stringify(batch, null, 2); // JSON 문자열로 변환

            const filename = `subresult_${i + 1}.json`; // 서브 JSON 파일 이름 설정
            const subFilePath = path.join(__dirname, filename); // 서브 JSON 파일 경로 설정

            // 파일에 데이터 쓰기
            fs.writeFileSync(subFilePath, subJsonData, "utf8");

            console.log(`Subfile ${filename} has been saved.`);
        }
    } catch (parseError) {
        console.error("Error parsing JSON:", parseError);
    }
});
