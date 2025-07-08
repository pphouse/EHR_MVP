import React, { useState, useEffect } from 'react';
import enhancedClinicalAPI from '../services/enhancedClinicalAPI';

const RealTimeClinicalSummary = ({ 
  basicInfo, 
  vitals, 
  subjective, 
  objective, 
  onSummaryGenerated,
  disabled = false 
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState(null);

  const canGenerate = basicInfo && vitals && subjective && objective && 
                     Object.keys(basicInfo).length > 0 && 
                     Object.keys(vitals).length > 0 && 
                     subjective.trim() && 
                     objective.trim();

  const generateSummary = async () => {
    if (!canGenerate || disabled) return;

    setIsGenerating(true);
    setError(null);

    try {
      const clinicalData = {
        basic_info: basicInfo,
        vitals: vitals,
        subjective: subjective,
        objective: objective,
        patient_history: [] // 必要に応じて既往歴を追加
      };

      const result = await enhancedClinicalAPI.generatePatientSummary(clinicalData);
      
      if (result.status === 'success') {
        setSummary(result.patient_situation);
        if (onSummaryGenerated) {
          onSummaryGenerated(result.patient_situation);
        }
      } else {
        throw new Error('状況整理の生成に失敗しました');
      }
    } catch (err) {
      console.error('Summary generation error:', err);
      setError(err.message || '状況整理の生成中にエラーが発生しました');
    } finally {
      setIsGenerating(false);
    }
  };

  // 自動生成機能（オプション）
  useEffect(() => {
    // デバウンス処理で自動生成を制御
    const timeoutId = setTimeout(() => {
      if (canGenerate && !summary && !isGenerating) {
        // 自動生成は無効化（手動ボタンのみ）
        // generateSummary();
      }
    }, 2000);

    return () => clearTimeout(timeoutId);
  }, [basicInfo, vitals, subjective, objective]);

  return (
    <div className="real-time-clinical-summary" style={{ marginTop: '20px', padding: '15px', border: '1px solid #ddd', borderRadius: '8px', backgroundColor: '#f9f9f9' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '15px' }}>
        <h3 style={{ margin: 0, color: '#333' }}>🤖 AI状況整理</h3>
        <button
          onClick={generateSummary}
          disabled={!canGenerate || disabled || isGenerating}
          style={{
            padding: '8px 16px',
            backgroundColor: canGenerate && !disabled ? '#007bff' : '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: canGenerate && !disabled ? 'pointer' : 'not-allowed',
            fontSize: '14px'
          }}
          data-testid="generate-summary-button"
        >
          {isGenerating ? '生成中...' : '状況整理を生成'}
        </button>
      </div>

      {!canGenerate && (
        <div style={{ padding: '10px', backgroundColor: '#fff3cd', border: '1px solid #ffeaa7', borderRadius: '4px', marginBottom: '10px' }}>
          <small style={{ color: '#856404' }}>
            基本情報、バイタルサイン、主観的所見(S)、客観的所見(O)をすべて入力してください
          </small>
        </div>
      )}

      {error && (
        <div style={{ padding: '10px', backgroundColor: '#f8d7da', border: '1px solid #f5c6cb', borderRadius: '4px', marginBottom: '10px' }}>
          <strong style={{ color: '#721c24' }}>エラー:</strong> {error}
        </div>
      )}

      {summary && (
        <div className="summary-content" data-testid="summary-content">
          <div style={{ marginBottom: '15px' }}>
            <h4 style={{ margin: '0 0 8px 0', color: '#007bff' }}>📋 患者状況要約</h4>
            <p style={{ margin: 0, lineHeight: '1.5', backgroundColor: 'white', padding: '10px', borderRadius: '4px' }}>
              {summary.summary}
            </p>
            <small style={{ color: '#6c757d' }}>
              信頼度: {(summary.confidence_score * 100).toFixed(0)}% | 
              生成時間: {new Date(summary.generated_at).toLocaleTimeString()}
            </small>
          </div>

          {summary.key_findings && summary.key_findings.length > 0 && (
            <div style={{ marginBottom: '15px' }}>
              <h5 style={{ margin: '0 0 8px 0', color: '#28a745' }}>🔍 重要所見</h5>
              <ul style={{ margin: 0, paddingLeft: '20px', backgroundColor: 'white', padding: '10px', borderRadius: '4px' }}>
                {summary.key_findings.map((finding, index) => (
                  <li key={index} style={{ marginBottom: '4px' }}>{finding}</li>
                ))}
              </ul>
            </div>
          )}

          {summary.differential_diagnoses && summary.differential_diagnoses.length > 0 && (
            <div style={{ marginBottom: '15px' }}>
              <h5 style={{ margin: '0 0 8px 0', color: '#dc3545' }}>🩺 鑑別診断候補</h5>
              <div style={{ backgroundColor: 'white', padding: '10px', borderRadius: '4px' }}>
                {summary.differential_diagnoses.map((diagnosis, index) => (
                  <div key={index} style={{ marginBottom: '10px', padding: '8px', border: '1px solid #eee', borderRadius: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <strong style={{ color: '#333' }}>{diagnosis.diagnosis}</strong>
                      <span style={{ 
                        backgroundColor: diagnosis.probability >= 0.6 ? '#28a745' : diagnosis.probability >= 0.3 ? '#ffc107' : '#6c757d',
                        color: 'white',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontSize: '12px'
                      }}>
                        {(diagnosis.probability * 100).toFixed(0)}%
                      </span>
                    </div>
                    {diagnosis.supporting_evidence && diagnosis.supporting_evidence.length > 0 && (
                      <div style={{ fontSize: '13px', color: '#6c757d', marginBottom: '4px' }}>
                        根拠: {diagnosis.supporting_evidence.join(', ')}
                      </div>
                    )}
                    {diagnosis.additional_tests && diagnosis.additional_tests.length > 0 && (
                      <div style={{ fontSize: '13px', color: '#007bff' }}>
                        推奨検査: {diagnosis.additional_tests.join(', ')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {summary.recommendations && summary.recommendations.length > 0 && (
            <div style={{ marginBottom: '15px' }}>
              <h5 style={{ margin: '0 0 8px 0', color: '#6f42c1' }}>💡 推奨事項</h5>
              <ul style={{ margin: 0, paddingLeft: '20px', backgroundColor: 'white', padding: '10px', borderRadius: '4px' }}>
                {summary.recommendations.map((recommendation, index) => (
                  <li key={index} style={{ marginBottom: '4px', color: '#333' }}>{recommendation}</li>
                ))}
              </ul>
            </div>
          )}

          {summary.risk_factors && summary.risk_factors.length > 0 && (
            <div>
              <h5 style={{ margin: '0 0 8px 0', color: '#fd7e14' }}>⚠️ リスク要因</h5>
              <div style={{ backgroundColor: 'white', padding: '10px', borderRadius: '4px' }}>
                {summary.risk_factors.map((risk, index) => (
                  <span key={index} style={{ 
                    display: 'inline-block',
                    backgroundColor: '#fff3cd',
                    color: '#856404',
                    padding: '4px 8px',
                    margin: '2px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    border: '1px solid #ffeaa7'
                  }}>
                    {risk}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div style={{ marginTop: '10px', padding: '8px', backgroundColor: '#e7f1ff', borderRadius: '4px', fontSize: '12px', color: '#0056b3' }}>
            ⚠️ この要約は医学的判断の補助として提供されています。最終的な診断・治療方針は医師の判断に基づいてください。
          </div>
        </div>
      )}
    </div>
  );
};

export default RealTimeClinicalSummary;