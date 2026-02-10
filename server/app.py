import os
import json
import uuid
from datetime import datetime
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from werkzeug.utils import secure_filename
from excel_parser import ExcelParser
import logging

# 配置日志
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# 配置
UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), 'uploads')
DATA_FOLDER = os.path.join(os.path.dirname(__file__), 'data')
DATASETS_FILE = os.path.join(DATA_FOLDER, 'datasets.json')
ALLOWED_EXTENSIONS = {'.xlsx', '.xls', '.csv'}

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 10 * 1024 * 1024  # 10MB

# 确保目录存在
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(DATA_FOLDER, exist_ok=True)

if not os.path.exists(DATASETS_FILE):
    with open(DATASETS_FILE, 'w', encoding='utf-8') as f:
        json.dump([], f, ensure_ascii=False, indent=2)

def allowed_file(filename):
    return '.' in filename and os.path.splitext(filename)[1].lower() in ALLOWED_EXTENSIONS

def get_datasets():
    """获取所有数据集"""
    try:
        with open(DATASETS_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        logger.error(f"读取数据集失败: {str(e)}")
        return []

def save_datasets(datasets):
    """保存数据集"""
    try:
        with open(DATASETS_FILE, 'w', encoding='utf-8') as f:
            json.dump(datasets, f, ensure_ascii=False, indent=2)
        return True
    except Exception as e:
        logger.error(f"保存数据集失败: {str(e)}")
        return False

@app.route('/api/datasets', methods=['GET'])
def get_all_datasets():
    """获取所有数据集列表"""
    try:
        datasets = get_datasets()
        return jsonify(datasets)
    except Exception as e:
        logger.error(f"获取数据集列表失败: {str(e)}")
        return jsonify({'error': '获取数据集失败'}), 500

@app.route('/api/datasets/<dataset_id>', methods=['GET'])
def get_dataset(dataset_id):
    """获取特定数据集"""
    try:
        datasets = get_datasets()
        dataset = next((d for d in datasets if d['id'] == dataset_id), None)
        
        if not dataset:
            return jsonify({'error': '数据集不存在'}), 404
            
        return jsonify(dataset)
    except Exception as e:
        logger.error(f"获取数据集失败: {str(e)}")
        return jsonify({'error': '获取数据集失败'}), 500

@app.route('/api/analysis/<dataset_id>', methods=['GET'])
def get_analysis_data(dataset_id):
    """获取分析数据"""
    try:
        datasets = get_datasets()
        dataset = next((d for d in datasets if d['id'] == dataset_id), None)
        
        if not dataset:
            return jsonify({'error': '数据集不存在'}), 404

        companies = dataset.get('companies', {})
        primary_insurance = '非车险'

        # 提取非车险数据
        non_auto_data = {}
        for key, value in companies.items():
            if primary_insurance in value:
                non_auto_data[key] = value[primary_insurance]

        # 计算统计指标
        total_premium = 0
        total_growth = 0
        count = 0
        
        for item in non_auto_data.values():
            total_premium += item.get('premium', 0)
            total_growth += item.get('growth', 0)
            count += 1
        
        avg_growth = round(total_growth / count, 2) if count > 0 else 0
        avg_share = 100 / count if count > 0 else 0

        # 构造BCG矩阵数据
        bcg_matrix = []
        for key, value in non_auto_data.items():
            premium = value.get('premium', 0)
            growth = value.get('growth', 0)
            share = (premium / total_premium) * 100 if total_premium > 0 else 0

            # 确定象限
            if growth >= avg_growth and share >= avg_share:
                quadrant = '明星'
            elif growth < avg_growth and share >= avg_share:
                quadrant = '奶牛'
            elif growth >= avg_growth and share < avg_share:
                quadrant = '野猫'
            else:
                quadrant = '瘦狗'

            bcg_matrix.append({
                'name': key.split('-')[-1] if '-' in key else key,
                'x': round(share, 2),
                'y': round(growth, 2),
                'z': premium,
                'quadrant': quadrant,
                'premium': premium,
                'growth': growth,
                'share': round(share, 2)
            })

        # CR4计算
        top_companies = sorted(bcg_matrix, key=lambda x: x['z'], reverse=True)[:4]
        cr4 = round(sum(item['share'] for item in top_companies))

        analysis_data = {
            'id': dataset['id'],
            'name': dataset['name'],
            'market_insight': {
                '非车险': {
                    'total_premium': total_premium,
                    'avg_growth': avg_growth,
                    'market_type': '高度集中' if cr4 > 60 else ('中度集中' if cr4 > 30 else '分散竞争'),
                    'cr4': cr4,
                    'top_companies': [{
                        'company': item['name'],
                        'premium': item['z'],
                        'growth': item['y'],
                        'share': item['share']
                    } for item in top_companies]
                }
            },
            'bcg_matrix': bcg_matrix,
            'summary': {
                'total_premium': total_premium,
                'avg_growth': avg_growth,
                'company_count': count,
                'market_type': '高度集中' if cr4 > 60 else ('中度集中' if cr4 > 30 else '分散竞争'),
                'cr4': cr4
            },
            'createdAt': dataset['createdAt']
        }

        return jsonify(analysis_data)
    except Exception as e:
        logger.error(f"获取分析数据失败: {str(e)}")
        return jsonify({'error': '获取分析数据失败'}), 500

@app.route('/api/upload', methods=['POST'])
def upload_file():
    """上传文件 - 增强版"""
    try:
        logger.info("收到文件上传请求")
        
        # 检查文件
        if 'file' not in request.files:
            logger.error("请求中没有文件")
            return jsonify({'error': '没有上传文件'}), 400
        
        file = request.files['file']
        if file.filename == '':
            logger.error("文件名为空")
            return jsonify({'error': '没有选择文件'}), 400
        
        # 验证文件类型
        if not allowed_file(file.filename):
            logger.error(f"不支持的文件类型: {file.filename}")
            return jsonify({'error': '只支持 .xlsx, .xls, .csv 格式的文件'}), 400
        
        logger.info(f"开始处理文件: {file.filename}")
        
        # 保存文件
        original_filename = file.filename
        timestamp = int(datetime.now().timestamp() * 1000)
        random_num = str(uuid.uuid4().int)[:4]
        ext = os.path.splitext(original_filename)[1]
        new_filename = f"{timestamp}-{random_num}{ext}"
        
        file_path = os.path.join(UPLOAD_FOLDER, new_filename)
        file.save(file_path)
        logger.info(f"文件已保存到: {file_path}")
        
        # 解析文件
        parser = ExcelParser()
        try:
            result = parser.parse_file(file_path)
            logger.info("文件解析成功")
        except Exception as parse_error:
            logger.error(f"文件解析失败: {str(parse_error)}")
            # 删除已保存的文件
            if os.path.exists(file_path):
                os.remove(file_path)
            return jsonify({'error': f'文件解析失败: {str(parse_error)}'}), 400
        
        # 创建数据集记录
        dataset_id = str(int(datetime.now().timestamp() * 1000))
        # 使用原始文件名（不含扩展名）作为数据集名称
        file_name_without_ext = os.path.splitext(original_filename)[0]
        
        new_dataset = {
            'id': dataset_id,
            'name': file_name_without_ext,
            'fileName': new_filename,
            'insurances': result['insurances'],
            'companies': result['companies'],
            'rawHtml': result['raw_html'],
            'createdAt': datetime.now().isoformat()
        }
        
        logger.info(f"创建数据集记录，ID: {dataset_id}")
        
        # 保存到数据集
        datasets = get_datasets()
        datasets.append(new_dataset)
        if save_datasets(datasets):
            logger.info("数据集保存成功")
        else:
            logger.error("数据集保存失败")
            return jsonify({'error': '数据保存失败'}), 500
        
        logger.info(f"文件上传完成: {file.filename}")
        return jsonify(new_dataset)
        
    except Exception as e:
        logger.error(f"上传文件失败: {str(e)}", exc_info=True)
        return jsonify({'error': f'上传失败: {str(e)}'}), 500

@app.route('/api/datasets/<dataset_id>', methods=['DELETE'])
def delete_dataset(dataset_id):
    """删除数据集"""
    try:
        datasets = get_datasets()
        dataset = next((d for d in datasets if d['id'] == dataset_id), None)
        
        if not dataset:
            return jsonify({'error': '数据集不存在'}), 404

        # 删除文件
        if 'fileName' in dataset:
            file_path = os.path.join(UPLOAD_FOLDER, dataset['fileName'])
            if os.path.exists(file_path):
                os.remove(file_path)

        # 从数据集中删除
        datasets = [d for d in datasets if d['id'] != dataset_id]
        save_datasets(datasets)

        return jsonify({'success': True})
    except Exception as e:
        logger.error(f"删除数据集失败: {str(e)}")
        return jsonify({'error': '删除数据集失败'}), 500

@app.route('/api/datasets/<dataset_id>', methods=['PUT'])
def update_dataset(dataset_id):
    """更新数据集"""
    try:
        data = request.get_json()
        name = data.get('name')
        
        if not name:
            return jsonify({'error': '名称不能为空'}), 400

        datasets = get_datasets()
        dataset = next((d for d in datasets if d['id'] == dataset_id), None)
        
        if not dataset:
            return jsonify({'error': '数据集不存在'}), 404

        dataset['name'] = name
        save_datasets(datasets)

        return jsonify(dataset)
    except Exception as e:
        logger.error(f"更新数据集失败: {str(e)}")
        return jsonify({'error': '更新数据集失败'}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 3001))
    print(f"🚀 服务器运行在 http://localhost:{port}")
    print(f"📁 上传目录: {UPLOAD_FOLDER}")
    print(f"📊 数据目录: {DATA_FOLDER}")
    app.run(host='0.0.0.0', port=port, debug=True)