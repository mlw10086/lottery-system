<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

class StateAPI {
    private $stateFile = __DIR__ . '/../data/lottery_state.json';
    
    public function handleRequest() {
        $method = $_SERVER['REQUEST_METHOD'];
        $action = $_GET['action'] ?? '';
        
        if ($method === 'GET' && $action === 'get') {
            return $this->getState();
        }
        
        return $this->error('不支持的请求');
    }
    
    private function getState() {
        if (!file_exists($this->stateFile)) {
            return $this->getDefaultState();
        }
        
        $content = file_get_contents($this->stateFile);
        $state = json_decode($content, true);
        
        if ($state === null) {
            return $this->getDefaultState();
        }
        
        return $state;
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
    
    private function error($message) {
        return [
            'success' => false,
            'message' => $message,
            'timestamp' => date('Y-m-d H:i:s')
        ];
    }
}

// 处理请求
$api = new StateAPI();
echo json_encode($api->handleRequest(), JSON_UNESCAPED_UNICODE);
?>
