// 抽奖系统核心逻辑
class LotterySystem {
    constructor() {
        this.cities = [];
        this.currentState = null;
        this.isAdmin = false;
        this.updateInterval = null;
        this.adminPassword = 'admin123'; // 简单密码，实际应用中应该更安全
        this.phase3ResultsDisplayed = false; // 标志第三轮结果是否已显示

        this.init();
    }

    async init() {
        await this.loadCities();
        await this.loadState();
        this.setupEventListeners();
        this.startStateUpdates();

        // 初始化权重显示
        this.updateWeightsDisplay();
    }

    async loadCities() {
        try {
            const response = await fetch('data/cities.json');
            const data = await response.json();
            this.cities = data.cities;
            this.displayCities();
        } catch (error) {
            console.error('加载城市数据失败:', error);
        }
    }

    async loadState() {
        try {
            const response = await fetch('php/state_api.php?action=get');
            this.currentState = await response.json();
            this.updateDisplay();
            this.syncWithServerState();
        } catch (error) {
            console.error('加载状态失败:', error);
        }
    }

    setupEventListeners() {
        // 管理员登录
        document.getElementById('adminBtn').addEventListener('click', () => {
            if (this.isAdmin) {
                this.logout();
            } else {
                document.getElementById('adminModal').style.display = 'block';
            }
        });

        // 关闭模态框
        document.querySelector('.close').addEventListener('click', () => {
            document.getElementById('adminModal').style.display = 'none';
        });

        // 管理员登录表单
        document.getElementById('adminForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.login();
        });

        // 管理员控制按钮
        document.getElementById('startPhase1').addEventListener('click', () => this.startPhase1());
        document.getElementById('startPhase2').addEventListener('click', () => this.startPhase2());
        document.getElementById('startPhase3').addEventListener('click', () => this.startPhase3());
        document.getElementById('resetLottery').addEventListener('click', () => this.resetLottery());
        document.getElementById('logoutAdmin').addEventListener('click', () => this.logout());

        // 点击模态框外部关闭
        window.addEventListener('click', (e) => {
            const modal = document.getElementById('adminModal');
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    }

    login() {
        const password = document.getElementById('adminPassword').value;
        if (password === this.adminPassword) {
            this.isAdmin = true;
            document.getElementById('adminModal').style.display = 'none';
            document.getElementById('adminPanel').style.display = 'block';
            document.getElementById('adminBtn').textContent = '管理员已登录';
            document.getElementById('adminBtn').style.background = 'linear-gradient(45deg, #66bb6a, #4caf50)';
            document.getElementById('adminPassword').value = '';
            
            // 更新按钮状态
            this.updateAdminButtons();
        } else {
            alert('密码错误！');
        }
    }

    logout() {
        this.isAdmin = false;
        document.getElementById('adminPanel').style.display = 'none';
        document.getElementById('adminBtn').textContent = '管理员登录';
        document.getElementById('adminBtn').style.background = 'linear-gradient(45deg, #ff6b6b, #ee5a24)';
    }

    updateAdminButtons() {
        const startPhase1 = document.getElementById('startPhase1');
        const startPhase2 = document.getElementById('startPhase2');
        const startPhase3 = document.getElementById('startPhase3');

        if (this.currentState) {
            startPhase1.disabled = this.currentState.phase1.status !== 'pending';
            startPhase2.disabled = this.currentState.phase1.status !== 'completed' ||
                                   this.currentState.phase2.status !== 'pending';

            // 检查第三轮状态，如果不存在则默认为pending
            const phase3Status = this.currentState.phase3 ? this.currentState.phase3.status : 'pending';
            startPhase3.disabled = this.currentState.phase2.status !== 'completed' ||
                                   phase3Status !== 'pending';
        }
    }

    async startPhase1() {
        try {
            const response = await fetch('php/lottery_api.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'start_phase1' })
            });
            
            const result = await response.json();
            if (result.success) {
                this.runPhase1Animation();
            }
        } catch (error) {
            console.error('启动第一轮抽奖失败:', error);
        }
    }

    async startPhase2() {
        try {
            const response = await fetch('php/lottery_api.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'start_phase2' })
            });
            
            const result = await response.json();
            if (result.success) {
                this.runPhase2Animation();
            }
        } catch (error) {
            console.error('启动第二轮抽奖失败:', error);
        }
    }

    runPhase1Animation() {
        const duration = 20000; // 20秒
        const startTime = Date.now();
        const timerElement = document.getElementById('phase1Timer');
        
        document.getElementById('statusText').textContent = '第一轮抽奖进行中';
        document.getElementById('statusDot').className = 'status-dot running';

        const animationInterval = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const remaining = Math.max(0, duration - elapsed);
            const seconds = Math.ceil(remaining / 1000);

            timerElement.textContent = `${seconds}秒`;

            // 随机高亮城市卡片
            this.highlightRandomCities();

            // 更新权重显示
            this.updateWeightsDisplay();

            if (remaining <= 0) {
                clearInterval(animationInterval);
                this.completePhase1();
            }
        }, 200); // 稍微降低更新频率以提高性能
    }

    runPhase2Animation() {
        const duration = 30000; // 30秒
        const startTime = Date.now();
        const timerElement = document.getElementById('phase2Timer');
        
        document.getElementById('statusText').textContent = '第二轮抽奖进行中';
        document.getElementById('statusDot').className = 'status-dot running';
        document.getElementById('phase2Section').style.display = 'block';

        const animationInterval = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const remaining = Math.max(0, duration - elapsed);
            const seconds = Math.ceil(remaining / 1000);

            timerElement.textContent = `${seconds}秒`;

            // 随机高亮第二轮城市卡片
            this.highlightRandomCitiesPhase2();

            // 更新权重显示
            this.updateWeightsDisplay();

            if (remaining <= 0) {
                clearInterval(animationInterval);
                this.completePhase2();
            }
        }, 250); // 第二轮稍慢一些，增加悬念
    }

    highlightRandomCities() {
        const cityCards = document.querySelectorAll('#phase1Cities .city-card');
        cityCards.forEach(card => card.classList.remove('highlight'));
        
        // 随机选择几个城市高亮
        const numHighlight = Math.floor(Math.random() * 3) + 2;
        const indices = [];
        while (indices.length < numHighlight) {
            const index = Math.floor(Math.random() * cityCards.length);
            if (!indices.includes(index)) {
                indices.push(index);
            }
        }
        
        indices.forEach(index => {
            cityCards[index].classList.add('highlight');
        });
    }

    highlightRandomCitiesPhase2() {
        const cityCards = document.querySelectorAll('#phase2Cities .city-card');
        cityCards.forEach(card => card.classList.remove('highlight'));

        // 随机选择城市高亮
        const numHighlight = Math.floor(Math.random() * 2) + 1;
        const indices = [];
        while (indices.length < numHighlight) {
            const index = Math.floor(Math.random() * cityCards.length);
            if (!indices.includes(index)) {
                indices.push(index);
            }
        }

        indices.forEach(index => {
            cityCards[index].classList.add('highlight');
        });
    }

    highlightRandomCitiesPhase3() {
        const cityCards = document.querySelectorAll('#phase3Cities .city-card');
        cityCards.forEach(card => card.classList.remove('highlight'));

        // 随机选择城市高亮
        const numHighlight = Math.floor(Math.random() * 2) + 1;
        const indices = [];
        while (indices.length < numHighlight) {
            const index = Math.floor(Math.random() * cityCards.length);
            if (!indices.includes(index)) {
                indices.push(index);
            }
        }

        indices.forEach(index => {
            cityCards[index].classList.add('highlight');
        });
    }

    async completePhase1() {
        try {
            const response = await fetch('php/lottery_api.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'complete_phase1' })
            });

            const result = await response.json();
            console.log('第一轮抽奖结果:', result);

            if (result.success && result.selected_cities) {
                this.displayPhase1Results(result.selected_cities);
                this.updateAdminButtons();
            } else {
                console.error('第一轮抽奖结果格式错误:', result);
                alert('第一轮抽奖失败：' + (result.message || '未知错误'));
            }
        } catch (error) {
            console.error('完成第一轮抽奖失败:', error);
            alert('第一轮抽奖请求失败：' + error.message);
        }
    }

    async completePhase2() {
        try {
            const response = await fetch('php/lottery_api.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'complete_phase2' })
            });

            const result = await response.json();
            console.log('第二轮抽奖结果:', result);

            if (result.success && result.selected_cities) {
                this.displayPhase2Results(result.selected_cities);
                this.updateAdminButtons();
            } else {
                console.error('第二轮抽奖结果格式错误:', result);
                alert('第二轮抽奖失败：' + (result.message || '未知错误'));
            }
        } catch (error) {
            console.error('完成第二轮抽奖失败:', error);
            alert('第二轮抽奖请求失败：' + error.message);
        }
    }

    async startPhase3() {
        try {
            const response = await fetch('php/lottery_api.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'start_phase3' })
            });

            const result = await response.json();
            console.log('第三轮抽奖开始:', result);

            if (result.success) {
                this.runPhase3Animation();
                this.updateAdminButtons();
            } else {
                alert('第三轮抽奖开始失败：' + (result.message || '未知错误'));
            }
        } catch (error) {
            console.error('开始第三轮抽奖失败:', error);
            alert('第三轮抽奖请求失败：' + error.message);
        }
    }

    runPhase3Animation() {
        const duration = 45000; // 45秒
        const startTime = Date.now();
        const timerElement = document.getElementById('phase3Timer');

        document.getElementById('statusText').textContent = '第三轮抽奖进行中';
        document.getElementById('statusDot').className = 'status-dot running';
        document.getElementById('phase3Section').style.display = 'block';

        // 第三轮开始时隐藏第二轮结果模块和最终结果模块，专注于第三轮抽奖
        document.getElementById('finalResult').style.display = 'none';
        document.getElementById('finalSection').style.display = 'none';

        const animationInterval = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const remaining = Math.max(0, duration - elapsed);
            const seconds = Math.ceil(remaining / 1000);

            timerElement.textContent = `${seconds}秒`;

            // 随机高亮第三轮城市卡片
            this.highlightRandomCitiesPhase3();

            // 更新权重显示
            this.updateWeightsDisplay();

            if (remaining <= 0) {
                clearInterval(animationInterval);
                this.completePhase3();
            }
        }, 200);
    }

    async completePhase3() {
        try {
            const response = await fetch('php/lottery_api.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'complete_phase3' })
            });

            const result = await response.json();
            console.log('第三轮抽奖结果:', result);

            if (result.success && result.selected_city) {
                this.displayPhase3Results(result.selected_city);
                this.updateAdminButtons();
                // 最终结果的显示将由状态同步处理
            } else {
                console.error('第三轮抽奖结果格式错误:', result);
                alert('第三轮抽奖失败：' + (result.message || '未知错误'));
            }
        } catch (error) {
            console.error('完成第三轮抽奖失败:', error);
            alert('第三轮抽奖请求失败：' + error.message);
        }
    }

    displayCities() {
        const container = document.getElementById('phase1Cities');
        container.innerHTML = '';
        
        this.cities.forEach(city => {
            const cityCard = document.createElement('div');
            cityCard.className = 'city-card';
            cityCard.innerHTML = `
                <h3>${city.name}</h3>
                <p>${city.description}</p>
                <div class="weight-bar">
                    <div class="weight-fill" style="width: ${city.weight * 100}%"></div>
                </div>
            `;
            container.appendChild(cityCard);
        });
    }

    displayPhase1Results(selectedCities) {
        // 检查参数有效性
        if (!selectedCities || !Array.isArray(selectedCities)) {
            console.error('selectedCities 无效:', selectedCities);
            return;
        }

        // 确保城市数据已加载
        if (!this.cities || this.cities.length === 0) {
            console.error('城市数据未加载');
            return;
        }

        // 更新城市卡片状态
        const cityCards = document.querySelectorAll('#phase1Cities .city-card');
        cityCards.forEach((card, index) => {
            if (index < this.cities.length) {
                const cityName = this.cities[index].name;
                if (selectedCities.some(city => city.name === cityName)) {
                    card.classList.add('selected');
                    card.classList.remove('eliminated');
                } else {
                    card.classList.add('eliminated');
                    card.classList.remove('selected');
                }
            }
        });

        // 显示结果
        const resultsElement = document.getElementById('phase1Results');
        if (resultsElement) {
            resultsElement.style.display = 'block';
        }

        const resultsContainer = document.getElementById('phase1Selected');
        if (resultsContainer) {
            resultsContainer.innerHTML = '';

            selectedCities.forEach(city => {
                const cityElement = document.createElement('div');
                cityElement.className = 'selected-city';
                cityElement.textContent = city.name;
                resultsContainer.appendChild(cityElement);
            });
        }

        // 准备第二轮
        this.setupPhase2Cities(selectedCities);

        // 更新状态显示
        const statusText = document.getElementById('statusText');
        const statusDot = document.getElementById('statusDot');
        if (statusText) statusText.textContent = '第一轮完成，等待第二轮';
        if (statusDot) statusDot.className = 'status-dot waiting';
    }

    setupPhase2Cities(selectedCities) {
        if (!selectedCities || !Array.isArray(selectedCities)) {
            console.error('setupPhase2Cities: selectedCities 无效');
            return;
        }

        const container = document.getElementById('phase2Cities');
        if (!container) {
            console.error('setupPhase2Cities: 找不到 phase2Cities 容器');
            return;
        }

        container.innerHTML = '';

        selectedCities.forEach(city => {
            const cityCard = document.createElement('div');
            cityCard.className = 'city-card';
            cityCard.innerHTML = `
                <h3>${city.name}</h3>
                <p>${city.description || '精选城市'}</p>
                <div class="weight-bar">
                    <div class="weight-fill" style="width: 100%"></div>
                </div>
            `;
            container.appendChild(cityCard);
        });
    }

    displayPhase2Results(selectedCities) {
        // 更新第二轮城市卡片状态
        const cityCards = document.querySelectorAll('#phase2Cities .city-card');
        cityCards.forEach(card => {
            const cityName = card.querySelector('h3').textContent;
            if (selectedCities.some(city => city.name === cityName)) {
                card.classList.add('selected');
            } else {
                card.classList.add('eliminated');
            }
        });

        // 显示第二轮结果
        document.getElementById('phase2Results').style.display = 'block';
        const resultsContainer = document.getElementById('phase2Selected');
        resultsContainer.innerHTML = '';

        selectedCities.forEach(city => {
            const cityElement = document.createElement('div');
            cityElement.className = 'selected-city';
            cityElement.textContent = city.name;
            resultsContainer.appendChild(cityElement);
        });

        // 显示第二轮完成的最终结果区域，展示这两个城市
        this.displayPhase2FinalResult(selectedCities);

        document.getElementById('statusText').textContent = '第二轮完成，等待第三轮';
        document.getElementById('statusDot').className = 'status-dot waiting';

        // 准备第三轮
        this.setupPhase3Cities(selectedCities);
    }

    displayPhase2FinalResult(selectedCities) {
        const finalContainer = document.getElementById('finalResult');
        finalContainer.innerHTML = `
            <h3>🎲 第二轮抽奖结果</h3>
            <div class="phase2-final-result">
                <h4>入围决赛的两个城市：</h4>
                <div class="finalist-cities">
                    ${selectedCities.map(city => `
                        <div class="finalist-city">
                            <h2>${city.name}</h2>
                            <p>${city.description}</p>
                            <div class="city-coords">
                                经度: ${city.longitude}°, 纬度: ${city.latitude}°
                            </div>
                        </div>
                    `).join('')}
                </div>
                <div class="next-round-info">
                    <p>🎯 这两个城市将进入第三轮决赛，最终决出获胜城市！</p>
                    <p>⏳ 等待管理员开始第三轮抽奖...</p>
                </div>
            </div>
        `;
        finalContainer.style.display = 'block';
    }

    setupPhase3Cities(selectedCities) {
        if (!selectedCities || !Array.isArray(selectedCities)) {
            console.error('setupPhase3Cities: selectedCities 无效');
            return;
        }

        const container = document.getElementById('phase3Cities');
        if (!container) {
            console.error('setupPhase3Cities: 找不到 phase3Cities 容器');
            return;
        }

        container.innerHTML = '';

        selectedCities.forEach(city => {
            const cityCard = document.createElement('div');
            cityCard.className = 'city-card';
            cityCard.innerHTML = `
                <h3>${city.name}</h3>
                <p>${city.description || '决赛城市'}</p>
                <div class="weight-bar">
                    <div class="weight-fill" style="width: 100%"></div>
                </div>
            `;
            container.appendChild(cityCard);
        });
    }

    async displayPhase3Results(selectedCity) {
        // 更新第三轮城市卡片状态
        const cityCards = document.querySelectorAll('#phase3Cities .city-card');
        cityCards.forEach(card => {
            const cityName = card.querySelector('h3').textContent;
            if (selectedCity.name === cityName) {
                card.classList.add('selected');
            } else {
                card.classList.add('eliminated');
            }
        });

        // 获取周边城市数据
        const nearbyData = await this.loadNearbyCities(selectedCity.name);

        // 显示第三轮结果作为最终结果
        const container = document.getElementById('phase3Results');
        container.innerHTML = `
            <h3>🎉 最终抽奖结果</h3>
            <div class="winner-city">
                <h1>${selectedCity.name}</h1>
                <p class="city-description">${selectedCity.description}</p>
                <div class="city-coords">
                    经度: ${selectedCity.longitude}°, 纬度: ${selectedCity.latitude}°
                </div>
            </div>
            <div class="final-message">
                <p>🏆 恭喜！经过三轮激烈的抽奖，最终获胜城市是：<strong>${selectedCity.name}</strong></p>
                <p>🎯 您的旅游目的地已确定，祝您旅途愉快！</p>
            </div>
            ${nearbyData ? this.generateNearbyCitiesHTML(nearbyData) : ''}
        `;
        container.style.display = 'block';

        // 隐藏第二轮结果模块，因为第三轮已经完成
        document.getElementById('finalResult').style.display = 'none';

        document.getElementById('statusText').textContent = '抽奖完成';
        document.getElementById('statusDot').className = 'status-dot completed';
    }

    async loadNearbyCities(cityName) {
        try {
            const response = await fetch('data/nearby_cities.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            return data.nearby_cities[cityName] || null;
        } catch (error) {
            console.error('加载周边城市数据失败:', error);
            return null;
        }
    }

    generateNearbyCitiesHTML(nearbyData) {
        if (!nearbyData || nearbyData.length === 0) {
            return '';
        }

        return `
            <div class="nearby-cities-section">
                <h4>🌟 周边高性价比旅游城市推荐</h4>
                <div class="nearby-cities-table">
                    <div class="table-header">
                        <div class="col-city">城市</div>
                        <div class="col-distance">距离</div>
                        <div class="col-transport">交通方式</div>
                        <div class="col-description">特色介绍</div>
                    </div>
                    ${nearbyData.map(city => `
                        <div class="table-row">
                            <div class="col-city">
                                <strong>${city.name}</strong>
                            </div>
                            <div class="col-distance">
                                ${city.distance}km
                            </div>
                            <div class="col-transport">
                                ${city.transport}
                            </div>
                            <div class="col-description">
                                ${city.description}
                            </div>
                        </div>
                    `).join('')}
                </div>
                <div class="nearby-tips">
                    <p>💡 以上推荐城市距离适中，交通便利，性价比高，适合作为旅游延伸目的地</p>
                </div>
            </div>
        `;
    }

    async displayFinalResultWithRecommendations(selectedCity) {
        try {
            const response = await fetch('php/distance_api.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'get_recommendations',
                    city: selectedCity.name
                })
            });

            const result = await response.json();

            const finalContainer = document.getElementById('finalResult');
            finalContainer.innerHTML = `
                <h3>🎉 最终抽奖结果</h3>
                <div class="winner-city">
                    <h1>${selectedCity.name}</h1>
                    <p class="city-description">${selectedCity.description}</p>
                    <div class="city-coords">
                        经度: ${selectedCity.longitude}°, 纬度: ${selectedCity.latitude}°
                    </div>
                </div>

                <div class="recommendations-section">
                    <h4>周边300公里内推荐旅游城市</h4>
                    <div class="recommendations-grid">
                        ${result.recommendations && result.recommendations.length > 0 ?
                            result.recommendations.slice(0, 5).map(city => `
                                <div class="recommendation-card">
                                    <h5>${city.name}</h5>
                                    <div class="distance">距离: ${city.distance}km</div>
                                    <div class="rating">评分: ${city.rating}⭐</div>
                                    <div class="highlights">
                                        ${city.highlights.map(h => `<span class="highlight">${h}</span>`).join('')}
                                    </div>
                                    <p class="description">${city.description}</p>
                                </div>
                            `).join('') :
                            '<p class="no-recommendations">暂无推荐城市数据</p>'
                        }
                    </div>
                </div>
            `;
            finalContainer.style.display = 'block';

            // 隐藏第二轮结果模块，因为最终结果已经显示
            const phase2FinalResult = document.querySelector('#finalResult .phase2-final-result');
            if (phase2FinalResult) {
                document.getElementById('finalResult').style.display = 'none';
            }

        } catch (error) {
            console.error('获取推荐城市失败:', error);

            // 显示基本的最终结果
            const finalContainer = document.getElementById('finalResult');
            finalContainer.innerHTML = `
                <h3>🎉 最终抽奖结果</h3>
                <div class="winner-city">
                    <h1>${selectedCity.name}</h1>
                    <p class="city-description">${selectedCity.description}</p>
                    <div class="city-coords">
                        经度: ${selectedCity.longitude}°, 纬度: ${selectedCity.latitude}°
                    </div>
                </div>
                <p class="error-message">推荐城市数据加载失败</p>
            `;
            finalContainer.style.display = 'block';
        }
    }

    async calculateFinalResult(selectedCities) {
        try {
            const response = await fetch('php/distance_api.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    action: 'calculate_distance',
                    cities: selectedCities 
                })
            });
            
            const result = await response.json();
            this.displayFinalResult(result);
        } catch (error) {
            console.error('计算最终结果失败:', error);
        }
    }

    displayFinalResult(result) {
        document.getElementById('finalSection').style.display = 'block';
        
        const distanceInfo = document.getElementById('distanceInfo');
        distanceInfo.innerHTML = `
            <h4>两城市距离</h4>
            <div class="distance-value">${result.distance.toFixed(0)} 公里</div>
        `;

        const finalChoice = document.getElementById('finalChoice');
        
        if (result.within_500km) {
            finalChoice.innerHTML = `
                <h4>🎉 恭喜！两个城市距离在500公里内</h4>
                <p>您的旅游目的地是：<strong>${result.cities[0].name}</strong> 和 <strong>${result.cities[1].name}</strong></p>
            `;
        } else {
            finalChoice.innerHTML = `
                <h4>⚠️ 两个城市距离超过500公里</h4>
                <p>请选择其中一个城市作为您的旅游目的地：</p>
                <div class="choice-buttons">
                    <button class="choice-btn" onclick="lottery.selectCity('${result.cities[0].name}')">
                        选择 ${result.cities[0].name}
                    </button>
                    <button class="choice-btn" onclick="lottery.selectCity('${result.cities[1].name}')">
                        选择 ${result.cities[1].name}
                    </button>
                </div>
            `;
        }
    }

    async selectCity(cityName) {
        try {
            const response = await fetch('php/distance_api.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    action: 'get_recommendations',
                    city: cityName 
                })
            });
            
            const result = await response.json();
            this.displayRecommendations(cityName, result.recommendations);
        } catch (error) {
            console.error('获取推荐城市失败:', error);
        }
    }

    displayRecommendations(selectedCity, recommendations) {
        const finalChoice = document.getElementById('finalChoice');
        finalChoice.innerHTML = `
            <h4>✅ 您选择了：${selectedCity}</h4>
        `;

        const recommendationsDiv = document.getElementById('recommendations');
        recommendationsDiv.style.display = 'block';
        recommendationsDiv.innerHTML = `
            <h4>🌟 ${selectedCity} 周边300公里内推荐城市</h4>
            <div class="recommendation-list">
                ${recommendations.map(city => `
                    <div class="recommendation-item">
                        <h5>${city.name}</h5>
                        <div class="distance">距离：${city.distance}公里</div>
                        <div class="rating">评分：${'⭐'.repeat(Math.floor(city.rating))} ${city.rating}</div>
                        <div class="highlights">亮点：${city.highlights.join('、')}</div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    updateWeightsDisplay() {
        const weightsChart = document.getElementById('weightsChart');
        if (!weightsChart) return;

        if (this.currentState && this.currentState.phase1.status === 'running') {
            // 生成实时权重数据
            const weights = this.generateRealTimeWeights();
            this.displayWeightsChart(weights, weightsChart);
        } else if (this.currentState && this.currentState.phase2.status === 'running') {
            // 第二轮权重显示
            const weights = this.generatePhase2Weights();
            this.displayWeightsChart(weights, weightsChart, '第二轮');
        } else if (this.currentState && this.currentState.phase3 && this.currentState.phase3.status === 'running') {
            // 第三轮权重显示
            const weights = this.generatePhase3Weights();
            this.displayWeightsChart(weights, weightsChart, '第三轮');
        } else if (this.currentState && this.currentState.current_phase === 'waiting') {
            // 等待状态显示
            this.showWaitingWeights();
        }
    }

    showWaitingWeights() {
        const weightsChart = document.getElementById('weightsChart');
        if (!weightsChart) return;

        weightsChart.innerHTML = `
            <h4>🎮 管理员权重控制台</h4>
            <div class="weights-info">
                <div style="text-align: center; padding: 40px 20px;">
                    <div style="font-size: 3em; margin-bottom: 15px;">🎯</div>
                    <h3 style="color: #4a5568; margin-bottom: 10px;">准备开始抽奖</h3>
                    <p style="color: #718096; margin-bottom: 20px;">点击"开始第一轮抽奖"按钮启动权重算法</p>
                    <div style="display: flex; justify-content: center; gap: 20px; flex-wrap: wrap;">
                        <div style="background: linear-gradient(45deg, #667eea, #764ba2); color: white; padding: 8px 16px; border-radius: 20px; font-size: 0.9em;">
                            🎮 管理员控制
                        </div>
                        <div style="background: linear-gradient(45deg, #43e97b, #38f9d7); color: white; padding: 8px 16px; border-radius: 20px; font-size: 0.9em;">
                            ⚡ 实时算法
                        </div>
                        <div style="background: linear-gradient(45deg, #f093fb, #f5576c); color: white; padding: 8px 16px; border-radius: 20px; font-size: 0.9em;">
                            📊 权重可视化
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    generateRealTimeWeights() {
        if (!this.cities || this.cities.length === 0) return [];

        return this.cities.map(city => ({
            name: city.name,
            weight: Math.random() * 100, // 模拟动态变化的权重
            color: this.getRandomColor()
        }));
    }

    generatePhase2Weights() {
        if (!this.currentState || !this.currentState.phase1.selected_cities) return [];

        return this.currentState.phase1.selected_cities.map(city => ({
            name: city.name,
            weight: Math.random() * 100,
            color: this.getRandomColor()
        }));
    }

    generatePhase3Weights() {
        if (!this.currentState || !this.currentState.phase2.selected_cities) return [];

        return this.currentState.phase2.selected_cities.map(city => ({
            name: city.name,
            weight: Math.random() * 100,
            color: this.getRandomColor()
        }));
    }

    displayWeightsChart(weights, container, phase = '第一轮') {
        if (!weights || weights.length === 0) return;

        // 计算总权重用于百分比计算
        const totalWeight = weights.reduce((sum, item) => sum + item.weight, 0);

        // 按权重大小排序（从高到低）
        const sortedWeights = weights.map((item, originalIndex) => ({
            ...item,
            originalIndex: originalIndex
        })).sort((a, b) => b.weight - a.weight);

        container.innerHTML = `
            <h4>🎲 ${phase}权重分布 (按概率排序)</h4>
            <div class="weights-bars">
                ${sortedWeights.map((item, sortedIndex) => {
                    const percentage = ((item.weight / totalWeight) * 100).toFixed(1);
                    const colorPair = this.getColorPair(item.originalIndex);
                    const rankIcon = sortedIndex < 3 ? ['🥇', '🥈', '🥉'][sortedIndex] : `#${sortedIndex + 1}`;
                    return `
                        <div class="weight-item ${sortedIndex < 3 ? 'top-rank' : ''}">
                            <div class="weight-label">
                                <span class="city-name">
                                    <span class="rank-icon">${rankIcon}</span>
                                    ${item.name}
                                </span>
                                <span class="weight-value">${percentage}%</span>
                            </div>
                            <div class="weight-bar-container">
                                <div class="weight-bar-fill"
                                     style="width: ${percentage}%;
                                            --bar-color: ${colorPair.main};
                                            --bar-color-light: ${colorPair.light};
                                            background: linear-gradient(90deg, ${colorPair.main}, ${colorPair.light});"></div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
            <div class="weights-info">
                <small>📊 按中奖概率排序 | 💡 权重每0.2秒动态调整 | 🎯 管理员视角</small>
            </div>
        `;
    }

    getRandomColor() {
        const colors = [
            '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
            '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    getColorPair(index) {
        const colorPairs = [
            { main: '#667eea', light: '#764ba2' },
            { main: '#f093fb', light: '#f5576c' },
            { main: '#4facfe', light: '#00f2fe' },
            { main: '#43e97b', light: '#38f9d7' },
            { main: '#fad0c4', light: '#ffd1ff' },
            { main: '#a8edea', light: '#fed6e3' },
            { main: '#ffecd2', light: '#fcb69f' },
            { main: '#ff9a9e', light: '#fecfef' },
            { main: '#a18cd1', light: '#fbc2eb' },
            { main: '#fad0c4', light: '#f8ad9d' }
        ];
        return colorPairs[index % colorPairs.length];
    }

    async resetLottery() {
        if (confirm('确定要重置抽奖吗？这将清除所有当前结果。')) {
            try {
                const response = await fetch('php/lottery_api.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'reset' })
                });

                const result = await response.json();
                if (result.success) {
                    // 保存管理员登录状态
                    const wasAdmin = this.isAdmin;

                    // 重置界面状态
                    this.resetUI();

                    // 恢复管理员状态
                    if (wasAdmin) {
                        this.isAdmin = true;
                        document.getElementById('adminPanel').style.display = 'block';
                        document.getElementById('adminBtn').textContent = '管理员已登录';
                        document.getElementById('adminBtn').style.background = 'linear-gradient(45deg, #66bb6a, #4caf50)';
                    }

                    // 重新加载数据
                    await this.loadCities();
                    await this.loadState();

                    alert('抽奖已重置');
                }
            } catch (error) {
                console.error('重置抽奖失败:', error);
                alert('重置失败：' + error.message);
            }
        }
    }

    resetUI() {
        // 重置所有界面元素到初始状态

        // 重置状态指示器
        document.getElementById('statusText').textContent = '等待开始';
        document.getElementById('statusDot').className = 'status-dot waiting';

        // 重置计时器
        document.getElementById('phase1Timer').textContent = '20秒';
        document.getElementById('phase2Timer').textContent = '30秒';
        document.getElementById('phase3Timer').textContent = '45秒';

        // 隐藏结果区域
        document.getElementById('phase1Results').style.display = 'none';
        document.getElementById('phase2Results').style.display = 'none';
        document.getElementById('phase2Section').style.display = 'none';
        document.getElementById('phase3Section').style.display = 'none';
        document.getElementById('phase3Results').style.display = 'none';
        document.getElementById('finalResult').style.display = 'none';
        document.getElementById('finalSection').style.display = 'none';
        document.getElementById('recommendations').style.display = 'none';

        // 清空结果容器
        document.getElementById('phase1Selected').innerHTML = '';
        document.getElementById('phase2Selected').innerHTML = '';
        document.getElementById('phase2Cities').innerHTML = '';
        document.getElementById('phase3Cities').innerHTML = '';
        document.getElementById('phase3Results').innerHTML = '';
        document.getElementById('finalResult').innerHTML = '';
        document.getElementById('distanceInfo').innerHTML = '';
        document.getElementById('finalChoice').innerHTML = '';

        // 重置城市卡片状态
        const allCityCards = document.querySelectorAll('.city-card');
        allCityCards.forEach(card => {
            card.classList.remove('selected', 'eliminated', 'highlight');
        });

        // 重置权重显示
        document.getElementById('weightsChart').innerHTML = '<p>抽奖开始后将显示权重变化</p>';

        // 重置动画状态标志
        this.viewerPhase1Running = false;
        this.viewerPhase2Running = false;
        this.phase3ResultsDisplayed = false;

        // 更新管理员按钮状态
        if (this.isAdmin) {
            document.getElementById('startPhase1').disabled = false;
            document.getElementById('startPhase2').disabled = true;
            document.getElementById('startPhase3').disabled = true;
        }
    }

    startStateUpdates() {
        this.updateInterval = setInterval(() => {
            this.loadState();
        }, 1000);
    }

    updateDisplay() {
        if (!this.currentState) return;

        // 更新状态显示
        const statusMap = {
            'waiting': '等待开始',
            'phase1_running': '第一轮抽奖中',
            'phase1_completed': '第一轮完成',
            'phase2_running': '第二轮抽奖中',
            'phase2_completed': '第二轮完成',
            'phase3_running': '第三轮抽奖中',
            'phase3_completed': '第三轮完成',
            'completed': '抽奖完成'
        };

        document.getElementById('statusText').textContent = statusMap[this.currentState.current_phase] || '未知状态';

        // 更新管理员按钮状态
        if (this.isAdmin) {
            this.updateAdminButtons();
        }
    }

    // 动态权重分池红包算法
    calculateDynamicWeights(cities, excludeSelected = []) {
        const availableCities = cities.filter(city =>
            !excludeSelected.some(selected => selected.id === city.id)
        );

        // 基础权重
        let weights = availableCities.map(() => 1.0);

        // 动态调整权重（模拟红包算法的随机性）
        const totalWeight = weights.reduce((sum, w) => sum + w, 0);
        const targetSelections = Math.min(5, availableCities.length);

        // 使用红包算法思想：随机分配权重
        for (let i = 0; i < weights.length; i++) {
            const randomFactor = Math.random() * 2; // 0-2倍随机因子
            weights[i] *= randomFactor;
        }

        // 归一化权重
        const newTotalWeight = weights.reduce((sum, w) => sum + w, 0);
        weights = weights.map(w => w / newTotalWeight);

        return weights;
    }

    // 基于权重选择城市
    selectCitiesByWeight(cities, weights, count) {
        const selected = [];
        const availableIndices = [...Array(cities.length).keys()];
        const availableWeights = [...weights];

        for (let i = 0; i < count && availableIndices.length > 0; i++) {
            // 累积权重选择
            const totalWeight = availableWeights.reduce((sum, w) => sum + w, 0);
            let random = Math.random() * totalWeight;

            let selectedIndex = 0;
            for (let j = 0; j < availableWeights.length; j++) {
                random -= availableWeights[j];
                if (random <= 0) {
                    selectedIndex = j;
                    break;
                }
            }

            // 添加选中的城市
            const cityIndex = availableIndices[selectedIndex];
            selected.push(cities[cityIndex]);

            // 移除已选择的城市
            availableIndices.splice(selectedIndex, 1);
            availableWeights.splice(selectedIndex, 1);
        }

        return selected;
    }

    // 同步服务器状态
    syncWithServerState() {
        if (!this.currentState) return;

        // 如果第一轮正在运行且观众页面还没有显示结果
        if (this.currentState.phase1.status === 'running' && !this.isAdmin) {
            this.startViewerPhase1Animation();
        }

        // 如果第一轮已完成但页面还没有显示结果
        if (this.currentState.phase1.status === 'completed' &&
            this.currentState.phase1.selected_cities.length > 0) {
            this.displayPhase1Results(this.currentState.phase1.selected_cities);
        }

        // 如果第二轮正在运行
        if (this.currentState.phase2.status === 'running' && !this.isAdmin) {
            this.startViewerPhase2Animation();
        }

        // 如果第二轮已完成，但第三轮还没开始，才显示第二轮结果
        if (this.currentState.phase2.status === 'completed' &&
            this.currentState.phase2.selected_cities.length > 0 &&
            (!this.currentState.phase3 || this.currentState.phase3.status === 'pending')) {
            this.displayPhase2Results(this.currentState.phase2.selected_cities);
        }

        // 如果第三轮已完成，只显示第三轮结果，第三轮结果就是最终结果
        if (this.currentState.phase3 && this.currentState.phase3.status === 'completed' &&
            this.currentState.phase3.selected_city && !this.phase3ResultsDisplayed) {
            this.displayPhase3Results(this.currentState.phase3.selected_city);
            this.phase3ResultsDisplayed = true;
            // 不再显示额外的最终结果模块，第三轮结果就是最终结果
        }
    }

    // 观众模式的第一轮动画
    startViewerPhase1Animation() {
        if (this.viewerPhase1Running) return;
        this.viewerPhase1Running = true;

        const startTime = new Date(this.currentState.phase1.start_time).getTime();
        const duration = this.currentState.phase1.duration * 1000;
        const timerElement = document.getElementById('phase1Timer');

        document.getElementById('statusText').textContent = '第一轮抽奖进行中';
        document.getElementById('statusDot').className = 'status-dot running';

        const animationInterval = setInterval(() => {
            const now = Date.now();
            const elapsed = now - startTime;
            const remaining = Math.max(0, duration - elapsed);
            const seconds = Math.ceil(remaining / 1000);

            timerElement.textContent = `${seconds}秒`;

            // 随机高亮城市卡片
            this.highlightRandomCities();

            if (remaining <= 0 || this.currentState.phase1.status === 'completed') {
                clearInterval(animationInterval);
                this.viewerPhase1Running = false;
                timerElement.textContent = '已完成';
            }
        }, 100);
    }

    // 观众模式的第二轮动画
    startViewerPhase2Animation() {
        if (this.viewerPhase2Running) return;
        this.viewerPhase2Running = true;

        const startTime = new Date(this.currentState.phase2.start_time).getTime();
        const duration = this.currentState.phase2.duration * 1000;
        const timerElement = document.getElementById('phase2Timer');

        document.getElementById('statusText').textContent = '第二轮抽奖进行中';
        document.getElementById('statusDot').className = 'status-dot running';
        document.getElementById('phase2Section').style.display = 'block';

        const animationInterval = setInterval(() => {
            const now = Date.now();
            const elapsed = now - startTime;
            const remaining = Math.max(0, duration - elapsed);
            const seconds = Math.ceil(remaining / 1000);

            timerElement.textContent = `${seconds}秒`;

            // 随机高亮第二轮城市卡片
            this.highlightRandomCitiesPhase2();

            if (remaining <= 0 || this.currentState.phase2.status === 'completed') {
                clearInterval(animationInterval);
                this.viewerPhase2Running = false;
                timerElement.textContent = '已完成';
            }
        }, 150);
    }
}

// 初始化抽奖系统
const lottery = new LotterySystem();
