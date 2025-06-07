<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

class LotteryAPI {
    private $stateFile = __DIR__ . '/../data/lottery_state.json';
    private $citiesFile = __DIR__ . '/../data/cities.json';
    
    public function __construct() {
        // 确保数据目录存在
        $dataDir = dirname($this->stateFile);
        if (!file_exists($dataDir)) {
            mkdir($dataDir, 0755, true);
        }

        // 确保状态文件存在
        if (!file_exists($this->stateFile)) {
            $this->saveState($this->getDefaultState());
        }
    }
    
    public function handleRequest() {
        $method = $_SERVER['REQUEST_METHOD'];
        
        if ($method === 'POST') {
            $input = json_decode(file_get_contents('php://input'), true);
            $action = $input['action'] ?? '';
            
            switch ($action) {
                case 'start_phase1':
                    return $this->startPhase1();
                case 'complete_phase1':
                    return $this->completePhase1();
                case 'start_phase2':
                    return $this->startPhase2();
                case 'complete_phase2':
                    return $this->completePhase2();
                case 'start_phase3':
                    return $this->startPhase3();
                case 'complete_phase3':
                    return $this->completePhase3();
                case 'reset':
                    return $this->resetLottery();
                default:
                    return $this->error('未知操作');
            }
        }
        
        return $this->error('不支持的请求方法');
    }
    
    private function loadState() {
        if (!file_exists($this->stateFile)) {
            return $this->getDefaultState();
        }
        
        $content = file_get_contents($this->stateFile);
        return json_decode($content, true);
    }
    
    private function saveState($state) {
        $state['last_updated'] = date('Y-m-d H:i:s');
        return file_put_contents($this->stateFile, json_encode($state, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    }
    
    private function loadCities() {
        if (!file_exists($this->citiesFile)) {
            return [];
        }
        
        $content = file_get_contents($this->citiesFile);
        $data = json_decode($content, true);
        return $data['cities'] ?? [];
    }
    
    private function getDefaultState() {
        return [
            'current_phase' => 'waiting',
            'admin_logged_in' => false,
            'phase1' => [
                'status' => 'pending',
                'duration' => 20,
                'start_time' => null,
                'end_time' => null,
                'selected_cities' => [],
                'weights_history' => []
            ],
            'phase2' => [
                'status' => 'pending',
                'duration' => 30,
                'start_time' => null,
                'end_time' => null,
                'selected_cities' => [],
                'weights_history' => []
            ],
            'phase3' => [
                'status' => 'pending',
                'duration' => 45,
                'start_time' => null,
                'end_time' => null,
                'selected_city' => null,
                'weights_history' => []
            ],
            'final_result' => [
                'cities' => [],
                'distance' => 0,
                'within_500km' => false,
                'user_choice' => null,
                'recommended_cities' => []
            ],
            'last_updated' => null
        ];
    }
    
    private function startPhase1() {
        $state = $this->loadState();

        if ($state['phase1']['status'] !== 'pending') {
            return $this->error('第一轮抽奖已经开始或完成');
        }

        $state['current_phase'] = 'phase1_running';
        $state['phase1']['status'] = 'running';
        $state['phase1']['start_time'] = date('Y-m-d H:i:s');

        // 立即保存状态
        if ($this->saveState($state) === false) {
            return $this->error('保存状态失败');
        }

        return $this->success('第一轮抽奖已开始', ['state' => $state]);
    }
    
    private function completePhase1() {
        $state = $this->loadState();
        $cities = $this->loadCities();
        
        if ($state['phase1']['status'] !== 'running') {
            return $this->error('第一轮抽奖未在进行中');
        }
        
        // 使用动态权重分池红包算法选择5个城市
        $selectedCities = $this->selectCitiesWithDynamicWeights($cities, 5);
        
        $state['current_phase'] = 'phase1_completed';
        $state['phase1']['status'] = 'completed';
        $state['phase1']['end_time'] = date('Y-m-d H:i:s');
        $state['phase1']['selected_cities'] = $selectedCities;
        
        $this->saveState($state);
        
        return array_merge($this->success('第一轮抽奖完成'), ['selected_cities' => $selectedCities]);
    }
    
    private function startPhase2() {
        $state = $this->loadState();

        if ($state['phase1']['status'] !== 'completed' || $state['phase2']['status'] !== 'pending') {
            return $this->error('第二轮抽奖条件不满足');
        }

        $state['current_phase'] = 'phase2_running';
        $state['phase2']['status'] = 'running';
        $state['phase2']['start_time'] = date('Y-m-d H:i:s');

        // 立即保存状态
        if ($this->saveState($state) === false) {
            return $this->error('保存状态失败');
        }

        return $this->success('第二轮抽奖已开始', ['state' => $state]);
    }
    
    private function completePhase2() {
        $state = $this->loadState();

        if ($state['phase2']['status'] !== 'running') {
            return $this->error('第二轮抽奖未在进行中');
        }

        // 从第一轮结果中随机选择2个城市（取消距离限制）
        $phase1Cities = $state['phase1']['selected_cities'];
        $selectedCities = $this->selectCitiesWithDynamicWeights($phase1Cities, 2);

        $state['current_phase'] = 'phase2_completed';
        $state['phase2']['status'] = 'completed';
        $state['phase2']['end_time'] = date('Y-m-d H:i:s');
        $state['phase2']['selected_cities'] = $selectedCities;

        $this->saveState($state);

        return array_merge($this->success('第二轮抽奖完成'), ['selected_cities' => $selectedCities]);
    }

    private function startPhase3() {
        $state = $this->loadState();

        if ($state['phase2']['status'] !== 'completed' || $state['phase3']['status'] !== 'pending') {
            return $this->error('第三轮抽奖条件不满足');
        }

        $state['current_phase'] = 'phase3_running';
        $state['phase3']['status'] = 'running';
        $state['phase3']['start_time'] = date('Y-m-d H:i:s');

        // 立即保存状态
        if ($this->saveState($state) === false) {
            return $this->error('保存状态失败');
        }

        return $this->success('第三轮抽奖已开始', ['state' => $state]);
    }

    private function completePhase3() {
        $state = $this->loadState();

        if ($state['phase3']['status'] !== 'running') {
            return $this->error('第三轮抽奖未在进行中');
        }

        // 从第二轮结果中选择1个城市作为最终结果
        $phase2Cities = $state['phase2']['selected_cities'];
        $selectedCity = $this->selectCitiesWithDynamicWeights($phase2Cities, 1)[0];

        $state['current_phase'] = 'phase3_completed';
        $state['phase3']['status'] = 'completed';
        $state['phase3']['end_time'] = date('Y-m-d H:i:s');
        $state['phase3']['selected_city'] = $selectedCity;
        $state['final_result']['cities'] = [$selectedCity];

        $this->saveState($state);

        return array_merge($this->success('第三轮抽奖完成'), ['selected_city' => $selectedCity]);
    }

    private function resetLottery() {
        $defaultState = $this->getDefaultState();
        $this->saveState($defaultState);
        
        return $this->success('抽奖已重置');
    }
    
    // 动态权重分池红包算法实现
    private function selectCitiesWithDynamicWeights($cities, $count) {
        if (count($cities) <= $count) {
            return $cities;
        }
        
        $selected = [];
        $available = $cities;
        
        for ($i = 0; $i < $count; $i++) {
            // 计算动态权重
            $weights = $this->calculateDynamicWeights($available);
            
            // 基于权重选择城市
            $selectedIndex = $this->weightedRandomSelect($weights);
            $selected[] = $available[$selectedIndex];
            
            // 移除已选择的城市
            array_splice($available, $selectedIndex, 1);
        }
        
        return $selected;
    }
    
    // 计算动态权重（红包算法思想）
    private function calculateDynamicWeights($cities) {
        $weights = [];
        $baseWeight = 1.0;
        
        foreach ($cities as $city) {
            // 基础权重 + 随机因子（模拟红包算法的随机性）
            $randomFactor = mt_rand(50, 200) / 100; // 0.5 - 2.0 的随机因子
            $weight = $baseWeight * $randomFactor;
            $weights[] = $weight;
        }
        
        // 归一化权重
        $totalWeight = array_sum($weights);
        return array_map(function($w) use ($totalWeight) {
            return $w / $totalWeight;
        }, $weights);
    }
    
    // 基于权重的随机选择
    private function weightedRandomSelect($weights) {
        $random = mt_rand() / mt_getrandmax();
        $cumulative = 0;
        
        for ($i = 0; $i < count($weights); $i++) {
            $cumulative += $weights[$i];
            if ($random <= $cumulative) {
                return $i;
            }
        }
        
        return count($weights) - 1; // 兜底返回最后一个
    }
    
    private function success($message, $data = []) {
        return [
            'success' => true,
            'message' => $message,
            'data' => $data,
            'timestamp' => date('Y-m-d H:i:s')
        ];
    }
    
    private function error($message) {
        return [
            'success' => false,
            'message' => $message,
            'timestamp' => date('Y-m-d H:i:s')
        ];
    }
}

// 处理请求
$api = new LotteryAPI();
echo json_encode($api->handleRequest(), JSON_UNESCAPED_UNICODE);
?>
