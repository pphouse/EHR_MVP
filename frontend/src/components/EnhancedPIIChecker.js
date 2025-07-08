import React, { useState } from 'react';
import enhancedClinicalAPI from '../services/enhancedClinicalAPI';

const EnhancedPIIChecker = ({ 
  text, 
  onPIIDetected,
  autoCheck = false,
  disabled = false 
}) => {
  const [isChecking, setIsChecking] = useState(false);
  const [piiResult, setPIIResult] = useState(null);
  const [error, setError] = useState(null);
  const [maskingLevel, setMaskingLevel] = useState('standard');

  const canCheck = text && text.trim().length > 0;

  const performPIICheck = async () => {
    if (!canCheck || disabled) return;

    setIsChecking(true);
    setError(null);

    try {
      const piiData = {
        text: text,
        medical_context: true,
        masking_level: maskingLevel
      };

      const result = await enhancedClinicalAPI.detectPII(piiData);
      
      if (result.status === 'success') {
        setPIIResult(result);
        if (onPIIDetected) {
          onPIIDetected(result);
        }
      } else {
        throw new Error('PII検知に失敗しました');
      }
    } catch (err) {
      console.error('PII detection error:', err);
      setError(err.message || 'PII検知中にエラーが発生しました');
    } finally {
      setIsChecking(false);
    }
  };

  const getRiskLevelColor = (riskLevel) => {
    switch (riskLevel) {
      case 'critical': return '#dc3545';
      case 'high': return '#fd7e14';
      case 'medium': return '#ffc107';
      case 'low': return '#28a745';
      default: return '#6c757d';
    }
  };

  const getRiskLevelText = (riskLevel) => {
    switch (riskLevel) {
      case 'critical': return '🔴 重大リスク';
      case 'high': return '🟠 高リスク';
      case 'medium': return '🟡 中リスク';
      case 'low': return '🟢 低リスク';
      default: return '⚪ 不明';
    }
  };

  return (
    <div className="enhanced-pii-checker" style={{ marginTop: '15px', padding: '12px', border: '1px solid #ddd', borderRadius: '6px', backgroundColor: '#f8f9fa' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <h4 style={{ margin: 0, color: '#333', fontSize: '16px' }}>🔒 PII保護チェック</h4>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <select
            value={maskingLevel}
            onChange={(e) => setMaskingLevel(e.target.value)}
            style={{ padding: '4px 8px', fontSize: '12px', borderRadius: '4px', border: '1px solid #ccc' }}
            disabled={disabled || isChecking}
          >
            <option value="minimal">最小マスキング</option>
            <option value="standard">標準マスキング</option>
            <option value="maximum">最大マスキング</option>
          </select>
          <button
            onClick={performPIICheck}
            disabled={!canCheck || disabled || isChecking}
            style={{
              padding: '6px 12px',
              backgroundColor: canCheck && !disabled ? '#6f42c1' : '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: canCheck && !disabled ? 'pointer' : 'not-allowed',
              fontSize: '12px'
            }}
            data-testid="pii-check-button"
          >
            {isChecking ? 'チェック中...' : 'PII検知'}
          </button>
        </div>
      </div>

      {!canCheck && (
        <div style={{ padding: '8px', backgroundColor: '#fff3cd', border: '1px solid #ffeaa7', borderRadius: '4px', marginBottom: '8px' }}>
          <small style={{ color: '#856404' }}>
            テキストを入力してPII検知を実行してください
          </small>
        </div>
      )}

      {error && (
        <div style={{ padding: '8px', backgroundColor: '#f8d7da', border: '1px solid #f5c6cb', borderRadius: '4px', marginBottom: '8px' }}>
          <strong style={{ color: '#721c24', fontSize: '12px' }}>エラー:</strong> <span style={{ fontSize: '12px', color: '#721c24' }}>{error}</span>
        </div>
      )}

      {piiResult && (
        <div className="pii-results" data-testid="pii-results">
          <div style={{ marginBottom: '10px' }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              backgroundColor: 'white',
              padding: '8px',
              borderRadius: '4px',
              border: `2px solid ${getRiskLevelColor(piiResult.risk_analysis.risk_level)}`
            }}>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#333' }}>
                  {getRiskLevelText(piiResult.risk_analysis.risk_level)}
                </div>
                <div style={{ fontSize: '11px', color: '#6c757d' }}>
                  {piiResult.detections.length}件のPII検知 | {piiResult.processing_method}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ 
                  fontSize: '18px', 
                  fontWeight: 'bold',
                  color: getRiskLevelColor(piiResult.risk_analysis.risk_level)
                }}>
                  {(piiResult.risk_analysis.overall_risk_score * 100).toFixed(0)}%
                </div>
                <small style={{ color: '#6c757d', fontSize: '10px' }}>リスクスコア</small>
              </div>
            </div>
          </div>

          {piiResult.detections && piiResult.detections.length > 0 && (
            <div style={{ marginBottom: '10px' }}>
              <h5 style={{ margin: '0 0 6px 0', color: '#dc3545', fontSize: '13px' }}>🔍 検知されたPII</h5>
              <div style={{ backgroundColor: 'white', padding: '8px', borderRadius: '4px', maxHeight: '120px', overflowY: 'auto' }}>
                {piiResult.detections.map((detection, index) => (
                  <div key={index} style={{ 
                    marginBottom: '6px', 
                    padding: '6px', 
                    border: '1px solid #f8d7da', 
                    borderRadius: '3px',
                    backgroundColor: '#fff5f5',
                    fontSize: '12px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                      <strong style={{ color: '#721c24' }}>{detection.type}</strong>
                      <span style={{ 
                        backgroundColor: '#dc3545',
                        color: 'white',
                        padding: '1px 4px',
                        borderRadius: '8px',
                        fontSize: '10px'
                      }}>
                        {(detection.confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div style={{ color: '#721c24', marginBottom: '2px' }}>
                      <span style={{ textDecoration: 'line-through' }}>{detection.text}</span> → <strong>{detection.masked_text}</strong>
                    </div>
                    <div style={{ fontSize: '10px', color: '#6c757d' }}>{detection.reasoning}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {piiResult.masked_text && piiResult.masked_text !== piiResult.original_text && (
            <div style={{ marginBottom: '10px' }}>
              <h5 style={{ margin: '0 0 6px 0', color: '#007bff', fontSize: '13px' }}>🔒 マスキング後テキスト</h5>
              <div style={{ 
                backgroundColor: 'white', 
                padding: '8px', 
                borderRadius: '4px',
                fontSize: '12px',
                lineHeight: '1.4',
                border: '1px solid #dee2e6'
              }}>
                {piiResult.masked_text}
              </div>
            </div>
          )}

          {piiResult.risk_analysis.recommendations && piiResult.risk_analysis.recommendations.length > 0 && (
            <div>
              <h5 style={{ margin: '0 0 6px 0', color: '#6f42c1', fontSize: '13px' }}>💡 推奨事項</h5>
              <ul style={{ margin: 0, paddingLeft: '16px', backgroundColor: 'white', padding: '8px', borderRadius: '4px', fontSize: '11px' }}>
                {piiResult.risk_analysis.recommendations.map((recommendation, index) => (
                  <li key={index} style={{ marginBottom: '3px', color: '#333' }}>{recommendation}</li>
                ))}
              </ul>
            </div>
          )}

          <div style={{ marginTop: '8px', padding: '6px', backgroundColor: '#e7f1ff', borderRadius: '4px', fontSize: '10px', color: '#0056b3' }}>
            ⚠️ PII検知結果は参考情報です。機密情報の取り扱いは組織のポリシーに従ってください。
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedPIIChecker;