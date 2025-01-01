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

    // 将关键词保存到文件
    const keywordsFile = `crazygames_${formattedDate}.txt`;
    fs.writeFileSync(keywordsFile, keywords.join('\n'));

    // 获取之前保存的文件
    const previousKeywordsFile = `crazygames_${formattedDate}.txt`;
    let diffContent = '';
    if (fs.existsSync(previousKeywordsFile)) {
      const previousKeywords = fs.readFileSync(previousKeywordsFile, 'utf-8').split('\n');
      diffContent = previousKeywords.filter(keyword => !keywords.includes(keyword)).join('\n');
    }

    // 保存 diff 文件
    if (diffContent) {
      const diffFile = `crazygames_diff_${formattedDate}.txt`;
      fs.writeFileSync(diffFile, diffContent);
    }

    // 将文件添加到 Git 仓库
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
