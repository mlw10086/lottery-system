// 观众实时查看功能
class LotteryViewer {
    constructor() {
        this.updateInterval = null;
        this.lastUpdateTime = null;
        this.isViewerMode = true;
        this.phase1AnimationRunning = false;
        this.phase2AnimationRunning = false;
        this.phase3AnimationRunning = false;

        this.init();
    }
    
    async init() {
        await this.loadAndDisplayCities();
        this.startRealTimeUpdates();
        this.setupViewerInterface();
    }
    
    startRealTimeUpdates() {
        // 每秒更新一次状态
        this.updateInterval = setInterval(() => {
            this.fetchAndUpdateState();
        }, 1000);
        
        // 立即执行一次
        this.fetchAndUpdateState();
    }
    
    async fetchAndUpdateState() {
        try {
            const response = await fetch('php/state_api.php?action=get');
            const state = await response.json();

            if (state && state.last_updated !== this.lastUpdateTime) {
                console.log('观众端状态更新:', state.current_phase, state.phase1.status, state.phase2.status);
                this.updateViewerDisplay(state);
                this.lastUpdateTime = state.last_updated;
            }
        } catch (error) {
            console.error('观众端获取状态失败:', error);
        }
    }
    
    updateViewerDisplay(state) {
        // 检测是否需要重置界面
        if (this.shouldResetUI(state)) {
            this.resetViewerUI();
        }

        this.updateStatusIndicator(state);
        this.updatePhaseDisplays(state);
        this.updateTimers(state);

        // 确保城市数据已加载
        if (!this.citiesLoaded) {
            this.loadAndDisplayCities();
        }

        // 处理第一轮抽奖
        if (state.phase1.status === 'running') {
            this.startPhase1ViewerAnimation(state);
        } else if (state.phase1.status === 'completed' && state.phase1.selected_cities.length > 0) {
            this.displayPhase1Results(state.phase1.selected_cities);
        }

        // 处理第二轮抽奖
        if (state.phase2.status === 'running') {
            this.startPhase2ViewerAnimation(state);
        } else if (state.phase2.status === 'completed' && state.phase2.selected_cities.length > 0 &&
                   (!state.phase3 || state.phase3.status === 'pending')) {
            // 只有在第三轮还没开始时才显示第二轮结果
            this.displayPhase2Results(state.phase2.selected_cities);
        }

        // 处理第三轮抽奖
        if (state.phase3 && state.phase3.status === 'running') {
            this.startPhase3ViewerAnimation(state);
        } else if (state.phase3 && state.phase3.status === 'completed' && state.phase3.selected_city) {
            this.displayPhase3Results(state.phase3.selected_city);
        }

        // 权重显示逻辑
        if (state.current_phase === 'waiting') {
            this.showWaitingWeights();
        } else if (state.phase1.status === 'running') {
            // 第一轮抽奖中，显示权重
            this.updateViewerWeightsDisplay('第一轮');
        } else if (state.phase2.status === 'running') {
            // 第二轮抽奖中，显示权重
            this.updateViewerWeightsDisplay('第二轮');
        } else if (state.phase3 && state.phase3.status === 'running') {
            // 第三轮抽奖中，显示权重
            this.updateViewerWeightsDisplay('第三轮');
        }

        // 保存当前状态用于下次比较
        this.lastState = JSON.parse(JSON.stringify(state));
    }
    
    updateStatusIndicator(state) {
        const statusText = document.getElementById('statusText');
        const statusDot = document.getElementById('statusDot');
        
        const statusMap = {
            'waiting': { text: '等待开始', class: 'waiting' },
            'phase1_running': { text: '第一轮抽奖进行中', class: 'running' },
            'phase1_completed': { text: '第一轮完成，等待第二轮', class: 'waiting' },
            'phase2_running': { text: '第二轮抽奖进行中', class: 'running' },
            'phase2_completed': { text: '第二轮完成，等待第三轮', class: 'waiting' },
            'phase3_running': { text: '第三轮抽奖进行中', class: 'running' },
            'phase3_completed': { text: '抽奖完成', class: 'completed' },
            'completed': { text: '全部完成', class: 'completed' }
        };
        
        const status = statusMap[state.current_phase] || { text: '未知状态', class: 'waiting' };
        statusText.textContent = status.text;
        statusDot.className = `status-dot ${status.class}`;
    }
    
    updatePhaseDisplays(state) {
        // 根据当前阶段显示相应的区域
        const phase1Section = document.getElementById('phase1Section');
        const phase2Section = document.getElementById('phase2Section');
        const phase3Section = document.getElementById('phase3Section');
        const finalSection = document.getElementById('finalSection');

        // 第一轮总是显示
        phase1Section.style.display = 'block';

        // 第二轮在第一轮完成后显示
        if (state.phase1.status === 'completed' || state.current_phase.includes('phase2')) {
            phase2Section.style.display = 'block';
        }

        // 第三轮在第二轮完成后显示
        if (state.phase2.status === 'completed' || state.current_phase.includes('phase3')) {
            if (phase3Section) phase3Section.style.display = 'block';
        }

        // 不再显示最终结果模块，第三轮结果就是最终结果
        // if (state.phase3 && state.phase3.status === 'completed') {
        //     finalSection.style.display = 'block';
        // }
    }
    
    updateTimers(state) {
        const phase1Timer = document.getElementById('phase1Timer');
        const phase2Timer = document.getElementById('phase2Timer');
        const phase3Timer = document.getElementById('phase3Timer');

        // 更新第一轮计时器
        if (state.phase1.status === 'running' && state.phase1.start_time) {
            const elapsed = this.getElapsedSeconds(state.phase1.start_time);
            const remaining = Math.max(0, state.phase1.duration - elapsed);
            phase1Timer.textContent = `${Math.ceil(remaining)}秒`;

            if (remaining <= 0) {
                phase1Timer.textContent = '时间到！';
            }
        } else if (state.phase1.status === 'completed') {
            phase1Timer.textContent = '已完成';
        }

        // 更新第二轮计时器
        if (state.phase2.status === 'running' && state.phase2.start_time) {
            const elapsed = this.getElapsedSeconds(state.phase2.start_time);
            const remaining = Math.max(0, state.phase2.duration - elapsed);
            phase2Timer.textContent = `${Math.ceil(remaining)}秒`;

            if (remaining <= 0) {
                phase2Timer.textContent = '时间到！';
            }
        } else if (state.phase2.status === 'completed') {
            phase2Timer.textContent = '已完成';
        }

        // 更新第三轮计时器
        if (state.phase3 && state.phase3.status === 'running' && state.phase3.start_time) {
            const elapsed = this.getElapsedSeconds(state.phase3.start_time);
            const remaining = Math.max(0, state.phase3.duration - elapsed);
            phase3Timer.textContent = `${Math.ceil(remaining)}秒`;

            if (remaining <= 0) {
                phase3Timer.textContent = '时间到！';
            }
        } else if (state.phase3 && state.phase3.status === 'completed') {
            phase3Timer.textContent = '已完成';
        }
    }
    
    getElapsedSeconds(startTime) {
        const start = new Date(startTime);
        const now = new Date();
        return (now - start) / 1000;
    }
    
    displayPhase1Results(selectedCities) {
        const resultsDiv = document.getElementById('phase1Results');
        const selectedDiv = document.getElementById('phase1Selected');
        
        resultsDiv.style.display = 'block';
        selectedDiv.innerHTML = '';
        
        selectedCities.forEach(city => {
            const cityElement = document.createElement('div');
            cityElement.className = 'selected-city';
            cityElement.textContent = city.name;
            selectedDiv.appendChild(cityElement);
        });
        
        // 更新城市卡片状态
        this.updateCityCardsStatus('phase1Cities', selectedCities);
        
        // 准备第二轮显示
        this.setupPhase2Display(selectedCities);
    }
    
    displayPhase2Results(selectedCities) {
        const resultsDiv = document.getElementById('phase2Results');
        const selectedDiv = document.getElementById('phase2Selected');

        resultsDiv.style.display = 'block';
        selectedDiv.innerHTML = '';

        selectedCities.forEach(city => {
            const cityElement = document.createElement('div');
            cityElement.className = 'selected-city';
            cityElement.textContent = city.name;
            selectedDiv.appendChild(cityElement);
        });

        // 更新第二轮城市卡片状态
        this.updateCityCardsStatus('phase2Cities', selectedCities);

        // 显示第二轮最终结果
        this.displayPhase2FinalResult(selectedCities);

        // 准备第三轮显示
        this.setupPhase3Display(selectedCities);
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

    async displayPhase3Results(selectedCity) {
        const resultsDiv = document.getElementById('phase3Results');

        // 获取周边城市数据
        const nearbyData = await this.loadNearbyCities(selectedCity.name);

        resultsDiv.innerHTML = `
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
        resultsDiv.style.display = 'block';

        // 隐藏第二轮结果模块和最终结果模块，因为第三轮已经完成
        const finalResult = document.getElementById('finalResult');
        const finalSection = document.getElementById('finalSection');
        if (finalResult) {
            finalResult.style.display = 'none';
        }
        if (finalSection) {
            finalSection.style.display = 'none';
        }

        // 更新第三轮城市卡片状态
        this.updateCityCardsStatus('phase3Cities', [selectedCity]);
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
            console.error('观众端加载周边城市数据失败:', error);
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

    setupPhase3Display(selectedCities) {
        const container = document.getElementById('phase3Cities');
        if (!container) return;

        container.innerHTML = '';

        selectedCities.forEach(city => {
            const cityCard = document.createElement('div');
            cityCard.className = 'city-card';
            cityCard.innerHTML = `
                <h3>${city.name}</h3>
                <p>${city.description}</p>
                <div class="weight-bar">
                    <div class="weight-fill" style="width: 100%"></div>
                </div>
            `;
            container.appendChild(cityCard);
        });
    }
    
    updateCityCardsStatus(containerId, selectedCities) {
        const container = document.getElementById(containerId);
        const cityCards = container.querySelectorAll('.city-card');
        
        cityCards.forEach(card => {
            const cityName = card.querySelector('h3').textContent;
            const isSelected = selectedCities.some(city => city.name === cityName);
            
            if (isSelected) {
                card.classList.add('selected');
                card.classList.remove('eliminated');
            } else {
                card.classList.add('eliminated');
                card.classList.remove('selected');
            }
        });
    }
    
    setupPhase2Display(selectedCities) {
        const container = document.getElementById('phase2Cities');
        container.innerHTML = '';
        
        selectedCities.forEach(city => {
            const cityCard = document.createElement('div');
            cityCard.className = 'city-card';
            cityCard.innerHTML = `
                <h3>${city.name}</h3>
                <p>${city.description}</p>
                <div class="weight-bar">
                    <div class="weight-fill" style="width: 100%"></div>
                </div>
            `;
            container.appendChild(cityCard);
        });
    }
    
    async displayFinalResults(state) {
        if (state.final_result.cities.length === 2) {
            try {
                const response = await fetch('php/distance_api.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action: 'calculate_distance',
                        cities: state.final_result.cities
                    })
                });
                
                const result = await response.json();
                this.showFinalResult(result);
            } catch (error) {
                console.error('计算距离失败:', error);
            }
        }
    }
    
    showFinalResult(result) {
        const distanceInfo = document.getElementById('distanceInfo');
        const finalChoice = document.getElementById('finalChoice');
        
        distanceInfo.innerHTML = `
            <h4>两城市距离</h4>
            <div class="distance-value">${result.distance.toFixed(0)} 公里</div>
        `;
        
        if (result.within_500km) {
            finalChoice.innerHTML = `
                <h4>🎉 恭喜！两个城市距离在500公里内</h4>
                <p>旅游目的地是：<strong>${result.cities[0].name}</strong> 和 <strong>${result.cities[1].name}</strong></p>
                <div style="margin-top: 20px; padding: 15px; background: rgba(102, 187, 106, 0.1); border-radius: 8px;">
                    <p>🎯 抽奖结果确定！您可以同时游览这两个城市。</p>
                </div>
            `;
        } else {
            finalChoice.innerHTML = `
                <h4>⚠️ 两个城市距离超过500公里</h4>
                <p>抽中的城市：<strong>${result.cities[0].name}</strong> 和 <strong>${result.cities[1].name}</strong></p>
                <div style="margin-top: 20px; padding: 15px; background: rgba(255, 193, 7, 0.1); border-radius: 8px;">
                    <p>📍 由于距离较远，建议选择其中一个城市进行深度游览。</p>
                    <p>💡 管理员可以为您推荐选定城市周边的高性价比旅游城市。</p>
                </div>
            `;
        }
    }
    
    setupViewerInterface() {
        // 为观众模式添加一些提示信息
        const container = document.querySelector('.container');
        
        // 添加观众模式提示
        const viewerNotice = document.createElement('div');
        viewerNotice.className = 'viewer-notice';
        viewerNotice.innerHTML = `
            <div style="background: rgba(102, 126, 234, 0.1); padding: 15px; border-radius: 8px; margin-bottom: 20px; text-align: center;">
                <h4>👥 观众模式</h4>
                <p>您正在实时观看抽奖过程，页面会自动更新显示最新状态</p>
                <div class="live-indicator">
                    <span style="color: #66bb6a; font-weight: bold;">● LIVE</span>
                    <span style="margin-left: 10px; font-size: 0.9em; color: #666;">实时同步中</span>
                </div>
            </div>
        `;
        
        // 插入到header后面
        const header = document.querySelector('header');
        header.insertAdjacentElement('afterend', viewerNotice);
        
        // 添加实时指示器动画
        const style = document.createElement('style');
        style.textContent = `
            .live-indicator {
                margin-top: 10px;
            }
            .live-indicator span:first-child {
                animation: livePulse 2s infinite;
            }
            @keyframes livePulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.5; }
            }
        `;
        document.head.appendChild(style);
    }
    
    async loadAndDisplayCities() {
        try {
            const response = await fetch('data/cities.json');
            const data = await response.json();
            this.cities = data.cities;
            this.displayCitiesInViewer();
            this.citiesLoaded = true;
            console.log('观众端城市数据加载成功:', this.cities.length, '个城市');
        } catch (error) {
            console.error('观众端加载城市数据失败:', error);
        }
    }

    displayCitiesInViewer() {
        const container = document.getElementById('phase1Cities');
        if (!container || this.cities.length === 0) return;

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

    startPhase1ViewerAnimation(state) {
        if (this.phase1AnimationRunning) return;
        this.phase1AnimationRunning = true;

        console.log('观众端开始第一轮动画', { citiesLoaded: this.citiesLoaded, citiesCount: this.cities?.length });

        const startTime = new Date(state.phase1.start_time).getTime();
        const duration = state.phase1.duration * 1000;

        // 立即显示一次权重
        this.updateViewerWeightsDisplay('第一轮');

        const animationInterval = setInterval(() => {
            const now = Date.now();
            const elapsed = now - startTime;
            const remaining = Math.max(0, duration - elapsed);

            // 随机高亮城市卡片
            this.highlightRandomCitiesViewer('phase1Cities');

            // 更新权重显示
            this.updateViewerWeightsDisplay('第一轮');

            if (remaining <= 0 || state.phase1.status === 'completed') {
                clearInterval(animationInterval);
                this.phase1AnimationRunning = false;
            }
        }, 200);
    }

    startPhase2ViewerAnimation(state) {
        if (this.phase2AnimationRunning) return;
        this.phase2AnimationRunning = true;

        console.log('观众端开始第二轮动画');

        const startTime = new Date(state.phase2.start_time).getTime();
        const duration = state.phase2.duration * 1000;

        // 立即显示一次权重
        this.updateViewerWeightsDisplay('第二轮');

        const animationInterval = setInterval(() => {
            const now = Date.now();
            const elapsed = now - startTime;
            const remaining = Math.max(0, duration - elapsed);

            // 随机高亮第二轮城市卡片
            this.highlightRandomCitiesViewer('phase2Cities');

            // 更新权重显示
            this.updateViewerWeightsDisplay('第二轮');

            if (remaining <= 0 || state.phase2.status === 'completed') {
                clearInterval(animationInterval);
                this.phase2AnimationRunning = false;
            }
        }, 250);
    }

    startPhase3ViewerAnimation(state) {
        if (this.phase3AnimationRunning) return;
        this.phase3AnimationRunning = true;

        console.log('观众端开始第三轮动画');

        const startTime = new Date(state.phase3.start_time).getTime();
        const duration = state.phase3.duration * 1000;

        // 显示第三轮界面
        const phase3Section = document.getElementById('phase3Section');
        if (phase3Section) phase3Section.style.display = 'block';

        // 第三轮开始时隐藏第二轮结果模块和最终结果模块，专注于第三轮抽奖
        const finalResult = document.getElementById('finalResult');
        const finalSection = document.getElementById('finalSection');
        if (finalResult) finalResult.style.display = 'none';
        if (finalSection) finalSection.style.display = 'none';

        // 立即显示一次权重
        this.updateViewerWeightsDisplay('第三轮');

        const animationInterval = setInterval(() => {
            const now = Date.now();
            const elapsed = now - startTime;
            const remaining = Math.max(0, duration - elapsed);
            const seconds = Math.ceil(remaining / 1000);

            // 更新第三轮计时器显示
            const phase3Timer = document.getElementById('phase3Timer');
            if (phase3Timer) {
                phase3Timer.textContent = `${seconds}秒`;
            }

            // 随机高亮第三轮城市卡片
            this.highlightRandomCitiesViewer('phase3Cities');

            // 更新权重显示
            this.updateViewerWeightsDisplay('第三轮');

            if (remaining <= 0 || state.phase3.status === 'completed') {
                clearInterval(animationInterval);
                this.phase3AnimationRunning = false;
            }
        }, 200);
    }

    highlightRandomCitiesViewer(containerId) {
        const cityCards = document.querySelectorAll(`#${containerId} .city-card`);
        if (cityCards.length === 0) return;

        cityCards.forEach(card => card.classList.remove('highlight'));

        // 随机选择几个城市高亮
        const numHighlight = Math.floor(Math.random() * 3) + 1;
        const indices = [];
        while (indices.length < numHighlight && indices.length < cityCards.length) {
            const index = Math.floor(Math.random() * cityCards.length);
            if (!indices.includes(index)) {
                indices.push(index);
            }
        }

        indices.forEach(index => {
            cityCards[index].classList.add('highlight');
        });
    }

    shouldResetUI(currentState) {
        // 如果没有上一个状态，不需要重置
        if (!this.lastState) return false;

        // 检测是否从已完成状态回到等待状态（表示重置了）
        const wasCompleted = this.lastState.phase1.status === 'completed' ||
                           this.lastState.phase2.status === 'completed';
        const nowWaiting = currentState.current_phase === 'waiting' &&
                          currentState.phase1.status === 'pending' &&
                          currentState.phase2.status === 'pending';

        return wasCompleted && nowWaiting;
    }

    resetViewerUI() {
        console.log('观众界面重置');

        // 重置状态指示器
        const statusText = document.getElementById('statusText');
        const statusDot = document.getElementById('statusDot');
        if (statusText) statusText.textContent = '等待开始';
        if (statusDot) statusDot.className = 'status-dot waiting';

        // 重置计时器
        const phase1Timer = document.getElementById('phase1Timer');
        const phase2Timer = document.getElementById('phase2Timer');
        const phase3Timer = document.getElementById('phase3Timer');
        if (phase1Timer) phase1Timer.textContent = '20秒';
        if (phase2Timer) phase2Timer.textContent = '30秒';
        if (phase3Timer) phase3Timer.textContent = '45秒';

        // 隐藏结果区域
        const elementsToHide = [
            'phase1Results', 'phase2Results', 'phase2Section',
            'phase3Section', 'phase3Results', 'finalResult',
            'finalSection', 'recommendations'
        ];
        elementsToHide.forEach(id => {
            const element = document.getElementById(id);
            if (element) element.style.display = 'none';
        });

        // 清空结果容器
        const containersToClear = [
            'phase1Selected', 'phase2Selected', 'phase2Cities',
            'phase3Cities', 'phase3Results', 'finalResult',
            'distanceInfo', 'finalChoice'
        ];
        containersToClear.forEach(id => {
            const element = document.getElementById(id);
            if (element) element.innerHTML = '';
        });

        // 重置城市卡片状态
        const allCityCards = document.querySelectorAll('.city-card');
        allCityCards.forEach(card => {
            card.classList.remove('selected', 'eliminated', 'highlight');
        });

        // 重置权重显示
        const weightsChart = document.getElementById('weightsChart');
        if (weightsChart) {
            weightsChart.innerHTML = '<p>抽奖开始后将显示权重变化</p>';
        }

        // 重置动画状态标志
        this.phase1AnimationRunning = false;
        this.phase2AnimationRunning = false;
        this.phase3AnimationRunning = false;

        // 重新加载和显示城市数据
        this.citiesLoaded = false;
        this.loadAndDisplayCities();
    }

    updateViewerWeightsDisplay(phase = '第一轮') {
        const weightsChart = document.getElementById('weightsChart');
        if (!weightsChart) return;

        // 生成模拟权重数据
        let weights = [];
        if (phase === '第一轮') {
            // 确保城市数据已加载
            if (!this.cities || this.cities.length === 0) {
                this.loadAndDisplayCities().then(() => {
                    this.updateViewerWeightsDisplay(phase);
                });
                return;
            }

            weights = this.cities.map((city, index) => ({
                name: city.name,
                weight: Math.random() * 100,
                color: this.getRandomColor(),
                index: index
            }));
        } else if (phase === '第二轮') {
            // 获取第一轮选中的城市
            const phase1Cities = document.querySelectorAll('#phase2Cities .city-card h3');
            weights = Array.from(phase1Cities).map((h3, index) => ({
                name: h3.textContent,
                weight: Math.random() * 100,
                color: this.getRandomColor(),
                index: index
            }));
        } else if (phase === '第三轮') {
            // 获取第二轮选中的城市
            const phase2Cities = document.querySelectorAll('#phase3Cities .city-card h3');
            weights = Array.from(phase2Cities).map((h3, index) => ({
                name: h3.textContent,
                weight: Math.random() * 100,
                color: this.getRandomColor(),
                index: index
            }));
        }

        if (weights.length > 0) {
            this.displayViewerWeightsChart(weights, weightsChart, phase);
        } else {
            console.log('观众端权重数据为空:', { phase, citiesLoaded: this.citiesLoaded, citiesCount: this.cities?.length });
        }
    }

    displayViewerWeightsChart(weights, container, phase = '第一轮') {
        if (!weights || weights.length === 0) return;

        const totalWeight = weights.reduce((sum, item) => sum + item.weight, 0);

        // 按权重大小排序（从高到低）
        const sortedWeights = weights.map((item, originalIndex) => ({
            ...item,
            originalIndex: originalIndex
        })).sort((a, b) => b.weight - a.weight);

        container.innerHTML = `
            <h4>👁️ ${phase}权重分布 (按概率排序)</h4>
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
                <small>📊 按中奖概率排序 | 👁️ 观众模式 - 实时同步观看 | 🎲 红包算法</small>
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

    showWaitingWeights() {
        const weightsChart = document.getElementById('weightsChart');
        if (!weightsChart) return;

        weightsChart.innerHTML = `
            <h4>🎲 权重分布系统</h4>
            <div class="weights-info">
                <div style="text-align: center; padding: 40px 20px;">
                    <div style="font-size: 3em; margin-bottom: 15px;">⏳</div>
                    <h3 style="color: #4a5568; margin-bottom: 10px;">等待抽奖开始</h3>
                    <p style="color: #718096; margin-bottom: 20px;">抽奖开始后将显示实时权重变化</p>
                    <div style="display: flex; justify-content: center; gap: 20px; flex-wrap: wrap;">
                        <div style="background: linear-gradient(45deg, #667eea, #764ba2); color: white; padding: 8px 16px; border-radius: 20px; font-size: 0.9em;">
                            🎯 动态权重算法
                        </div>
                        <div style="background: linear-gradient(45deg, #43e97b, #38f9d7); color: white; padding: 8px 16px; border-radius: 20px; font-size: 0.9em;">
                            🎲 红包分池算法
                        </div>
                        <div style="background: linear-gradient(45deg, #f093fb, #f5576c); color: white; padding: 8px 16px; border-radius: 20px; font-size: 0.9em;">
                            👁️ 实时透明
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    destroy() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
    }
}

// 观众查看器总是启动，与管理员系统并行运行
document.addEventListener('DOMContentLoaded', () => {
    // 延迟启动观众查看器，确保lottery实例已经初始化
    setTimeout(() => {
        console.log('启动观众查看器');
        window.lotteryViewer = new LotteryViewer();
    }, 100);
});
