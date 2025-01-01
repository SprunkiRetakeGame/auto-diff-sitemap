const axios = require('axios');
const fs = require('fs');
const { execSync } = require('child_process');

const url = 'https://api.crazygames.com/v3/en_US/page/allGames?paginationPage=1&paginationSize=100';
const today = new Date();
const formattedDate = today.toISOString().split('T')[0];  // 格式化为 YYYY-MM-DD

// 请求 API 获取游戏数据
axios.get(url)
  .then(response => {
    const games = response.data.games.items;
    // 提取并排序 SEO 关键词
    const keywords = games.map(game => game.seoKeyword).sort();

    // 定义文件路径
    const keywordsFile = 'crazygames.txt';
    const diffFile = `crazygames_diff_${formattedDate}.txt`;

    // 读取现有的 keywords.txt 文件（如果存在）
    let previousKeywords = [];
    if (fs.existsSync(keywordsFile)) {
      previousKeywords = fs.readFileSync(keywordsFile, 'utf-8').split('\n');
    }

    // 找到差异：diffData 是新数据中存在而旧数据中没有的关键词
    const diffData = keywords.filter(keyword => !previousKeywords.includes(keyword));

    // 将差异数据写入到 diff 文件
    if (diffData.length > 0) {
      fs.writeFileSync(diffFile, diffData.join('\n'), 'utf-8');
    } else {
      console.log('No new keywords to write to diff file.');
    }

    // 将最新的关键词写入 crazygames.txt 文件
    fs.writeFileSync(keywordsFile, keywords.join('\n'), 'utf-8');

    // 将文件添加到 Git 仓库并提交
    execSync('git config --global user.name "github-actions"');
    execSync('git config --global user.email "actions@github.com"');
    execSync('git add .');
    execSync('git commit -m "Update CrazyGames keywords"');
    execSync('git push');
  })
  .catch(error => {
    console.error('Error fetching data:', error);
    process.exit(1);
  });
