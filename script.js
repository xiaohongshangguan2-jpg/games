// 游戏状态变量
let gameState = {
    currentPage: 'home',
    difficulty: 'easy',
    currentMode: null,
    currentLevel: 1,
    currentQuestion: 0,
    totalQuestions: 5,
    score: 0,
    medals: [],
    correctAnswers: 0
};

// 语音合成设置
const speechOptions = {
    lang: 'zh-CN',
    pitch: 1.2, // 音调稍高，模拟小兔子声音
    rate: 0.9, // 语速稍慢，适合儿童
    volume: 1
};

// 题目类型
const QUESTION_TYPES = {
    NUMBER_RECOGNITION: 'number_recognition',
    ADDITION: 'addition'
};

// 加载本地存储数据
function loadGameData() {
    const savedData = localStorage.getItem('numberAdventureGame');
    if (savedData) {
        const parsedData = JSON.parse(savedData);
        gameState = {
            ...gameState,
            ...parsedData
        };
    }
}

// 语音合成函数
function speak(text) {
    console.log('语音合成请求:', text);
    if ('speechSynthesis' in window) {
        console.log('语音合成API可用');
        // 确保语音合成已经初始化
        const voices = speechSynthesis.getVoices();
        console.log('可用语音数量:', voices.length);
        
        // 无论是否有可用语音，都尝试播放
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = speechOptions.lang;
        utterance.pitch = speechOptions.pitch;
        utterance.rate = speechOptions.rate;
        utterance.volume = speechOptions.volume;
        
        // 尝试找到中文语音
        let chineseVoice = voices.find(voice => voice.lang.includes('zh'));
        console.log('找到中文语音:', chineseVoice);
        if (chineseVoice) {
            utterance.voice = chineseVoice;
        }
        
        console.log('开始播放语音:', text);
        try {
            speechSynthesis.speak(utterance);
        } catch (error) {
            console.error('语音播放失败:', error);
        }
        
        // 处理语音合成初始化
        if (voices.length === 0) {
            console.log('等待语音合成初始化...');
            speechSynthesis.onvoiceschanged = function() {
                console.log('语音合成初始化完成');
                const newVoices = speechSynthesis.getVoices();
                console.log('新的可用语音数量:', newVoices.length);
            };
        }
    } else {
        console.log('语音合成API不可用');
    }
}

// 保存游戏数据到本地存储
function saveGameData() {
    localStorage.setItem('numberAdventureGame', JSON.stringify(gameState));
}

// 绑定事件监听器
function bindEventListeners() {
    // 难度选择按钮
    document.querySelectorAll('.difficulty-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.difficulty-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            gameState.difficulty = this.dataset.difficulty;
            // 难度选择语音提示
            speak(`已选择${this.textContent}难度`);
        });
    });
    
    // 开始游戏按钮
    document.getElementById('start-game').addEventListener('click', function() {
        if (gameState.currentMode === QUESTION_TYPES.NUMBER_RECOGNITION) {
            startGame(); // 认识数字模式开始游戏
        } else {
            showPage('mode-selection');
            // 模式选择页面语音提示
            speak('请选择游戏模式');
        }
    });
    
    // 模式选择按钮
    document.getElementById('number-recognition-mode').addEventListener('click', function() {
        gameState.currentMode = QUESTION_TYPES.NUMBER_RECOGNITION;
        speak('选择了认识数字模式');
        showPage('home'); // 跳转到难度选择页面
    });
    
    document.getElementById('addition-mode').addEventListener('click', function() {
        gameState.currentMode = QUESTION_TYPES.ADDITION;
        speak('选择了加法运算模式');
        startGame();
    });
    
    // 从难度选择页返回模式选择页
    document.getElementById('back-from-home').addEventListener('click', function() {
        showPage('mode-selection');
        speak('返回上一页');
    });
    
    // 查看勋章按钮
    document.getElementById('view-medals').addEventListener('click', function() {
        showPage('medals');
        renderMedals();
        speak('查看我的勋章');
    });
    
    // 从游戏页面返回
    document.getElementById('back-home').addEventListener('click', function() {
        // 认识数字模式返回难度选择页面，加法运算模式返回模式选择页面
        if (gameState.currentMode === QUESTION_TYPES.NUMBER_RECOGNITION) {
            showPage('home');
        } else {
            showPage('mode-selection');
        }
        speak('返回上一页');
    });
    
    // 从勋章页面返回模式选择页
    document.getElementById('back-from-medals').addEventListener('click', function() {
        showPage('mode-selection');
        speak('返回上一页');
    });
    
    // 提交答案按钮
    document.getElementById('submit-answer').addEventListener('click', checkAnswer);
    
    // 提示按钮
    document.getElementById('hint-btn').addEventListener('click', function() {
        showHint();
        speak('查看提示');
    });
    
    // 关闭奖励弹窗
    document.getElementById('close-reward').addEventListener('click', function() {
        document.getElementById('reward-modal').classList.add('hidden');
        nextQuestion();
    });
    
    // 下一关按钮
    document.getElementById('next-level').addEventListener('click', function() {
        document.getElementById('level-up-modal').classList.add('hidden');
        gameState.currentLevel++;
        gameState.currentQuestion = 0;
        gameState.correctAnswers = 0;
        speak(`进入第${gameState.currentLevel}关`);
        startGame();
    });
    
    // 投屏按钮
    document.getElementById('cast-btn').addEventListener('click', function() {
        startCasting();
    });
}

// 投屏功能
let castStream = null;
let castDisplay = null;

function startCasting() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
        alert('您的浏览器不支持投屏功能，请使用Chrome、Edge或Firefox浏览器');
        return;
    }
    
    navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true
    })
    .then(stream => {
        castStream = stream;
        // 显示投屏成功提示
        alert('投屏已开始，请在目标设备上查看游戏画面');
        speak('投屏已开始');
        
        // 监听流结束事件
        stream.getVideoTracks()[0].onended = function() {
            alert('投屏已结束');
            speak('投屏已结束');
            castStream = null;
            castDisplay = null;
        };
    })
    .catch(err => {
        console.error('投屏失败:', err);
        alert('投屏失败，请检查设备权限');
        speak('投屏失败');
    });
}

// 显示页面
function showPage(pageName) {
    document.querySelectorAll('.page').forEach(page => {
        page.classList.add('hidden');
    });
    document.getElementById(`${pageName}-page`).classList.remove('hidden');
    gameState.currentPage = pageName;
}

// 开始游戏
function startGame() {
    // 重置问题计数
    gameState.currentQuestion = 0;
    gameState.correctAnswers = 0;
    showPage('game');
    updateGameInfo();
    // 游戏开始语音提示
    speak(`游戏开始！当前是第${gameState.currentLevel}关`);
    generateQuestion();
}

// 更新游戏信息
function updateGameInfo() {
    document.getElementById('current-level').textContent = gameState.currentLevel;
    document.getElementById('current-score').textContent = gameState.score;
    updateProgressBar();
}

// 更新进度条
function updateProgressBar() {
    const progress = (gameState.currentQuestion / gameState.totalQuestions) * 100;
    document.querySelector('.progress-fill').style.width = `${progress}%`;
}

// 生成题目
function generateQuestion() {
    const questionText = document.getElementById('question-text');
    const animationArea = document.getElementById('animation-area');
    
    // 检查是否选择了模式
    if (!gameState.currentMode) {
        questionText.textContent = '请先选择游戏模式';
        animationArea.innerHTML = '';
        return;
    }
    
    // 根据难度和题目类型生成题目
    let question, correctAnswer, questionType, num1, num2;
    
    // 使用当前选择的模式
    questionType = gameState.currentMode;
    
    // 如果是答错了，使用之前的题目信息
    if (gameState.isWrong && gameState.currentQuestionInfo) {
        const info = gameState.currentQuestionInfo;
        question = info.question;
        correctAnswer = info.correctAnswer;
        num1 = info.num1;
        num2 = info.num2;
        
        // 重新生成动画
        animationArea.innerHTML = '';
        if (questionType === QUESTION_TYPES.NUMBER_RECOGNITION) {
            // 数字认知题目动画
            const numberElement = document.createElement('div');
            numberElement.textContent = correctAnswer;
            numberElement.className = 'number-animation';
            numberElement.style.fontSize = '4rem';
            numberElement.style.color = '#ff6b9d';
            animationArea.appendChild(numberElement);
        } else {
            // 加法题目动画
            // 显示第一个数字的数量
            for (let i = 0; i < num1; i++) {
                const dot = document.createElement('div');
                dot.className = 'count-animation';
                dot.style.width = '30px';
                dot.style.height = '30px';
                dot.style.borderRadius = '50%';
                dot.style.background = '#4ecdc4';
                dot.style.margin = '5px';
                dot.style.display = 'inline-block';
                animationArea.appendChild(dot);
            }
            
            // 显示加号
            const plus = document.createElement('div');
            plus.textContent = '+';
            plus.style.fontSize = '2rem';
            plus.style.margin = '0 10px';
            animationArea.appendChild(plus);
            
            // 显示第二个数字的数量
            for (let i = 0; i < num2; i++) {
                const dot = document.createElement('div');
                dot.className = 'count-animation';
                dot.style.width = '30px';
                dot.style.height = '30px';
                dot.style.borderRadius = '50%';
                dot.style.background = '#ff6b9d';
                dot.style.margin = '5px';
                dot.style.display = 'inline-block';
                animationArea.appendChild(dot);
            }
            
            // 显示等号
            const equals = document.createElement('div');
            equals.textContent = '=';
            equals.style.fontSize = '2rem';
            equals.style.margin = '0 10px';
            animationArea.appendChild(equals);
        }
    } else {
        // 生成新题目
        if (questionType === QUESTION_TYPES.NUMBER_RECOGNITION) {
            // 数字认知题目
            const maxNumber = getMaxNumberByDifficulty();
            correctAnswer = Math.floor(Math.random() * (maxNumber + 1));
            question = `请找出数字 ${correctAnswer}`;
            
            // 生成动画
            animationArea.innerHTML = '';
            const numberElement = document.createElement('div');
            numberElement.textContent = correctAnswer;
            numberElement.className = 'number-animation';
            numberElement.style.fontSize = '4rem';
            numberElement.style.color = '#ff6b9d';
            animationArea.appendChild(numberElement);
        } else {
            // 加法题目
            const maxNumber = getMaxAdditionNumberByDifficulty();
            num1 = Math.floor(Math.random() * (maxNumber + 1));
            num2 = Math.floor(Math.random() * (maxNumber + 1));
            correctAnswer = num1 + num2;
            question = `${num1} + ${num2} = ?`;
            
            // 生成动画
            animationArea.innerHTML = '';
            
            // 显示第一个数字的数量
            for (let i = 0; i < num1; i++) {
                const dot = document.createElement('div');
                dot.className = 'count-animation';
                dot.style.width = '30px';
                dot.style.height = '30px';
                dot.style.borderRadius = '50%';
                dot.style.background = '#4ecdc4';
                dot.style.margin = '5px';
                dot.style.display = 'inline-block';
                animationArea.appendChild(dot);
            }
            
            // 显示加号
            const plus = document.createElement('div');
            plus.textContent = '+';
            plus.style.fontSize = '2rem';
            plus.style.margin = '0 10px';
            animationArea.appendChild(plus);
            
            // 显示第二个数字的数量
            for (let i = 0; i < num2; i++) {
                const dot = document.createElement('div');
                dot.className = 'count-animation';
                dot.style.width = '30px';
                dot.style.height = '30px';
                dot.style.borderRadius = '50%';
                dot.style.background = '#ff6b9d';
                dot.style.margin = '5px';
                dot.style.display = 'inline-block';
                animationArea.appendChild(dot);
            }
            
            // 显示等号
            const equals = document.createElement('div');
            equals.textContent = '=';
            equals.style.fontSize = '2rem';
            equals.style.margin = '0 10px';
            animationArea.appendChild(equals);
        }
        
        // 保存题目信息
        gameState.currentQuestionInfo = {
            question: question,
            correctAnswer: correctAnswer,
            num1: num1,
            num2: num2
        };
    }
    
    // 更新题目文本
    questionText.textContent = question;
    
    // 存储当前题目的正确答案和类型
    gameState.currentCorrectAnswer = correctAnswer;
    gameState.currentQuestionType = questionType;
    
    // 朗读题目
    speak(question);
    
    // 生成选项
    generateOptions(correctAnswer);
}

// 根据难度获取最大数字
function getMaxNumberByDifficulty() {
    switch (gameState.difficulty) {
        case 'easy': return 10;
        case 'medium': return 20;
        case 'hard': return 30;
        default: return 10;
    }
}

// 根据难度获取加法最大数字
function getMaxAdditionNumberByDifficulty() {
    switch (gameState.difficulty) {
        case 'easy': return 5;
        case 'medium': return 7;
        case 'hard': return 10;
        default: return 5;
    }
}

// 生成选项
function generateOptions(correctAnswer) {
    // 检查是否已经选择了模式
    if (!gameState.currentMode) {
        return;
    }
    
    const optionsContainer = document.getElementById('options-container');
    optionsContainer.innerHTML = '';
    
    // 生成选项数组
    const options = [correctAnswer];
    
    // 生成3个错误选项
    while (options.length < 4) {
        let wrongAnswer;
        const randomOffset = Math.floor(Math.random() * 5) + 1;
        
        if (Math.random() < 0.5) {
            wrongAnswer = correctAnswer + randomOffset;
        } else {
            wrongAnswer = Math.max(0, correctAnswer - randomOffset);
        }
        
        // 确保不重复且为非负数
        if (!options.includes(wrongAnswer) && wrongAnswer >= 0) {
            options.push(wrongAnswer);
        }
    }
    
    // 打乱选项顺序
    shuffleArray(options);
    
    // 创建选项按钮
    options.forEach(option => {
        const optionBtn = document.createElement('button');
        optionBtn.className = 'option-btn';
        optionBtn.textContent = option;
        optionBtn.dataset.value = option;
        
        optionBtn.addEventListener('click', function() {
            selectOption(this);
        });
        
        optionsContainer.appendChild(optionBtn);
    });
    
    // 禁用提交按钮
    document.getElementById('submit-answer').disabled = true;
}

// 选择选项
function selectOption(selectedBtn) {
    const allOptions = document.querySelectorAll('.option-btn');
    
    // 移除所有选项的选中状态
    allOptions.forEach(btn => btn.classList.remove('selected'));
    
    // 添加选中状态
    selectedBtn.classList.add('selected');
    
    // 启用提交按钮
    document.getElementById('submit-answer').disabled = false;
    
    // 存储用户选择的答案
    gameState.selectedAnswer = parseInt(selectedBtn.dataset.value);
    
    // 播报选择的数字
    speak(`选择了 ${gameState.selectedAnswer}`);
}

// 打乱数组
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

// 检查答案
function checkAnswer() {
    const userAnswer = gameState.selectedAnswer;
    
    if (userAnswer === undefined) {
        return;
    }
    
    const allOptions = document.querySelectorAll('.option-btn');
    
    if (userAnswer === gameState.currentCorrectAnswer) {
        // 答对了
        gameState.correctAnswers++;
        gameState.score += 10;
        gameState.isWrong = false;
        
        // 显示正确答案的动画效果
        allOptions.forEach(btn => {
            if (parseInt(btn.dataset.value) === gameState.currentCorrectAnswer) {
                btn.classList.add('correct');
            }
        });
        
        // 延迟显示奖励
        setTimeout(() => {
            showReward('太棒了！真聪明！');
        }, 500);
    } else {
        // 答错了
        gameState.isWrong = true;
        // 显示错误答案的动画效果
        allOptions.forEach(btn => {
            if (parseInt(btn.dataset.value) === userAnswer) {
                btn.classList.add('wrong');
            }
        });
        
        // 显示正确答案
        allOptions.forEach(btn => {
            if (parseInt(btn.dataset.value) === gameState.currentCorrectAnswer) {
                btn.classList.add('correct');
            }
        });
        
        // 延迟显示奖励
        setTimeout(() => {
            showReward('再试一次，你可以的！');
        }, 500);
    }
    
    saveGameData();
}

// 显示奖励弹窗
function showReward(message) {
    const rewardModal = document.getElementById('reward-modal');
    const rewardMessage = document.getElementById('reward-message');
    
    rewardMessage.textContent = message;
    rewardModal.classList.remove('hidden');
    
    // 播报奖励消息
    speak(message);
}

// 下一题
function nextQuestion() {
    // 检查是否已经选择了模式
    if (!gameState.currentMode) {
        return;
    }
    
    // 如果答错了，不增加题目数，重新做这题
    if (!gameState.isWrong) {
        gameState.currentQuestion++;
        updateProgressBar();
    }
    
    if (gameState.currentQuestion < gameState.totalQuestions) {
        generateQuestion();
    } else {
        // 通关
        completeLevel();
    }
}

// 完成关卡
function completeLevel() {
    // 检查是否已经选择了模式
    if (!gameState.currentMode) {
        return;
    }
    
    // 解锁勋章
    unlockMedal();
    
    // 显示通关弹窗
    const levelUpModal = document.getElementById('level-up-modal');
    const levelUpMessage = document.getElementById('level-up-message');
    
    const message = `恭喜你通过了第 ${gameState.currentLevel} 关！获得了 ${gameState.correctAnswers * 10} 积分！`;
    levelUpMessage.textContent = message;
    levelUpModal.classList.remove('hidden');
    
    // 播报通关消息
    speak(message);
    
    saveGameData();
}

// 解锁勋章
function unlockMedal() {
    const medalName = `${gameState.currentMode === QUESTION_TYPES.NUMBER_RECOGNITION ? '认识数字' : '加法运算'} 关卡 ${gameState.currentLevel} 勋章`;
    const medalIcon = gameState.currentMode === QUESTION_TYPES.NUMBER_RECOGNITION ? '🔢' : '➕';
    
    // 检查是否已经解锁
    const alreadyUnlocked = gameState.medals.some(medal => medal.name === medalName);
    
    if (!alreadyUnlocked) {
        gameState.medals.push({ name: medalName, icon: medalIcon });
    }
}

// 显示提示
function showHint() {
    const animationArea = document.getElementById('animation-area');
    
    // 根据题目类型显示不同的提示
    if (gameState.currentQuestionType === QUESTION_TYPES.NUMBER_RECOGNITION) {
        // 数字认知提示：突出显示数字
        const numberElement = document.createElement('div');
        numberElement.textContent = gameState.currentCorrectAnswer;
        numberElement.className = 'number-animation';
        numberElement.style.fontSize = '5rem';
        numberElement.style.color = '#ffd93d';
        numberElement.style.animation = 'starPulse 1s ease-in-out infinite';
        animationArea.innerHTML = '';
        animationArea.appendChild(numberElement);
    } else {
        // 加法提示：显示总数
        animationArea.innerHTML = '';
        
        // 显示所有点
        for (let i = 0; i < gameState.currentCorrectAnswer; i++) {
            const dot = document.createElement('div');
            dot.className = 'count-animation';
            dot.style.width = '30px';
            dot.style.height = '30px';
            dot.style.borderRadius = '50%';
            dot.style.background = '#ffd93d';
            dot.style.margin = '5px';
            dot.style.display = 'inline-block';
            animationArea.appendChild(dot);
        }
        
        // 显示总数
        const total = document.createElement('div');
        total.textContent = `总数: ${gameState.currentCorrectAnswer}`;
        total.style.fontSize = '1.5rem';
        total.style.marginTop = '10px';
        total.style.color = '#ffd93d';
        animationArea.appendChild(total);
    }
}

// 渲染勋章
function renderMedals() {
    const medalsGrid = document.querySelector('.medals-grid');
    medalsGrid.innerHTML = '';
    
    if (gameState.medals.length === 0) {
        const emptyMessage = document.createElement('div');
        emptyMessage.textContent = '还没有获得勋章，开始闯关吧！';
        emptyMessage.style.gridColumn = '1 / -1';
        emptyMessage.style.textAlign = 'center';
        emptyMessage.style.padding = '40px';
        emptyMessage.style.color = '#666';
        medalsGrid.appendChild(emptyMessage);
    } else {
        gameState.medals.forEach(medal => {
            const medalItem = document.createElement('div');
            medalItem.className = 'medal-item';
            medalItem.innerHTML = `
                <div class="medal-icon">${medal.icon}</div>
                <div class="medal-name">${medal.name}</div>
            `;
            medalsGrid.appendChild(medalItem);
        });
    }
}

// 初始化游戏
// 确保DOM元素加载完成后再初始化游戏
window.onload = function() {
    // 重置游戏状态
    gameState = {
        currentPage: 'home',
        difficulty: 'easy',
        currentMode: null,
        currentLevel: 1,
        currentQuestion: 0,
        totalQuestions: 5,
        score: 0,
        medals: [],
        correctAnswers: 0,
        isWrong: false,
        currentQuestionInfo: null
    };
    
    // 清除本地存储数据，确保从初始状态开始
    localStorage.removeItem('numberAdventureGame');
    
    // 绑定事件监听器
    bindEventListeners();
    
    // 显示模式选择页面（首次进入先显示模式选择）
    showPage('mode-selection');
    speak('欢迎来到数字探险游戏！请选择游戏模式。');
    
    console.log('游戏初始化完成，等待用户交互...');
    
    // 添加用户交互事件来激活语音合成
    document.body.addEventListener('click', function initSpeech() {
        console.log('用户首次点击，激活语音合成...');
        // 移除事件监听器，避免重复触发
        document.body.removeEventListener('click', initSpeech);
    }, { once: true });
    
    // 预加载语音合成
    if ('speechSynthesis' in window) {
        console.log('预加载语音合成...');
        speechSynthesis.getVoices();
    }
};