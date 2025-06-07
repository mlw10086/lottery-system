<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

class DistanceAPI {
    private $nearbyCitiesFile = __DIR__ . '/../data/nearby_cities.json';
    
    public function handleRequest() {
        $method = $_SERVER['REQUEST_METHOD'];
        
        if ($method === 'POST') {
            $input = json_decode(file_get_contents('php://input'), true);
            $action = $input['action'] ?? '';
            
            switch ($action) {
                case 'calculate_distance':
                    return $this->calculateDistance($input['cities']);
                case 'get_recommendations':
                    return $this->getRecommendations($input['city']);
                default:
                    return $this->error('未知操作');
            }
        }
        
        return $this->error('不支持的请求方法');
    }
    
    private function calculateDistance($cities) {
        if (count($cities) !== 2) {
            return $this->error('需要提供两个城市');
        }
        
        $city1 = $cities[0];
        $city2 = $cities[1];
        
        // 使用Haversine公式计算两点间距离
        $distance = $this->haversineDistance(
            $city1['latitude'], $city1['longitude'],
            $city2['latitude'], $city2['longitude']
        );
        
        $within500km = $distance <= 500;
        
        return [
            'success' => true,
            'cities' => $cities,
            'distance' => $distance,
            'within_500km' => $within500km,
            'message' => $within500km ? '距离在500公里内' : '距离超过500公里',
            'timestamp' => date('Y-m-d H:i:s')
        ];
    }
    
    private function getRecommendations($cityName) {
        if (!file_exists($this->nearbyCitiesFile)) {
            return $this->error('推荐数据文件不存在');
        }
        
        $content = file_get_contents($this->nearbyCitiesFile);
        $data = json_decode($content, true);
        
        $recommendations = $data['nearby_recommendations'][$cityName] ?? [];
        
        // 过滤300公里内的城市
        $filtered = array_filter($recommendations, function($city) {
            return $city['distance'] <= 300;
        });
        
        // 按评分排序
        usort($filtered, function($a, $b) {
            return $b['rating'] <=> $a['rating'];
        });
        
        return [
            'success' => true,
            'city' => $cityName,
            'recommendations' => array_values($filtered),
            'count' => count($filtered),
            'timestamp' => date('Y-m-d H:i:s')
        ];
    }
    
    // Haversine公式计算地球上两点间距离
    private function haversineDistance($lat1, $lon1, $lat2, $lon2) {
        $earthRadius = 6371; // 地球半径（公里）
        
        $dLat = deg2rad($lat2 - $lat1);
        $dLon = deg2rad($lon2 - $lon1);
        
        $a = sin($dLat/2) * sin($dLat/2) +
             cos(deg2rad($lat1)) * cos(deg2rad($lat2)) *
             sin($dLon/2) * sin($dLon/2);
        
        $c = 2 * atan2(sqrt($a), sqrt(1-$a));
        
        return $earthRadius * $c;
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
$api = new DistanceAPI();
echo json_encode($api->handleRequest(), JSON_UNESCAPED_UNICODE);
?>
