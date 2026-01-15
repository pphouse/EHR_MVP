import React, { useEffect, useState } from 'react';
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
  const [showEnsembleDetails, setShowEnsembleDetails] = useState(false);
  const [showSynthesisReasoning, setShowSynthesisReasoning] = useState(false);

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
    <div className="real-time-clinical-summary" style={{
      marginTop: '20px',
      padding: '15px',
      border: '1px solid #ddd',
      borderRadius: '8px',
      backgroundColor: '#f9f9f9',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      transition: 'all 0.3s ease'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '15px',
        flexWrap: 'wrap',
        gap: '10px'
      }}>
        <h3 style={{ margin: 0, color: '#333', fontSize: '18px' }}>🤖 AI状況整理</h3>
        <button
          onClick={generateSummary}
          disabled={!canGenerate || disabled || isGenerating}
          style={{
            padding: '8px 16px',
            backgroundColor: canGenerate && !disabled ? (isGenerating ? '#17a2b8' : '#007bff') : '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: canGenerate && !disabled ? 'pointer' : 'not-allowed',
            fontSize: '14px',
            fontWeight: 'bold',
            transition: 'all 0.3s ease',
            transform: isGenerating ? 'scale(0.98)' : 'scale(1)',
            boxShadow: canGenerate && !disabled && !isGenerating ? '0 2px 4px rgba(0,123,255,0.3)' : 'none'
          }}
          data-testid="generate-summary-button"
          onMouseEnter={(e) => {
            if (canGenerate && !disabled && !isGenerating) {
              e.target.style.backgroundColor = '#0056b3';
              e.target.style.transform = 'scale(1.05)';
            }
          }}
          onMouseLeave={(e) => {
            if (canGenerate && !disabled && !isGenerating) {
              e.target.style.backgroundColor = '#007bff';
              e.target.style.transform = 'scale(1)';
            }
          }}
        >
          {isGenerating ? '🔄 生成中...' : '✨ 状況整理を生成'}
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
          {/* アンサンブル診断情報（3つのLLMを使用した場合） */}
          {summary.is_ensemble && (
            <div style={{
              marginBottom: '15px',
              padding: '12px',
              backgroundColor: '#e8f5e9',
              border: '2px solid #4caf50',
              borderRadius: '8px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '20px', marginRight: '8px' }}>🧠</span>
                <h4 style={{ margin: 0, color: '#2e7d32' }}>アンサンブル診断システム</h4>
              </div>
              <div style={{ fontSize: '13px', color: '#1b5e20', marginBottom: '8px' }}>
                <strong>3つの最先端AI</strong>が協調して診断を生成しました：
                <div style={{ marginTop: '6px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {summary.individual_model_results && summary.individual_model_results.map((model, idx) => (
                    <span key={idx} style={{
                      backgroundColor: 'white',
                      padding: '4px 10px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      border: '1px solid #4caf50',
                      color: '#2e7d32'
                    }}>
                      {model.model_name} ({(model.confidence_score * 100).toFixed(0)}%)
                    </span>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px', fontSize: '13px' }}>
                <div>
                  <strong>コンセンサスレベル:</strong>
                  <span style={{
                    marginLeft: '6px',
                    padding: '2px 8px',
                    backgroundColor: summary.consensus_level >= 0.7 ? '#4caf50' : summary.consensus_level >= 0.5 ? '#ff9800' : '#f44336',
                    color: 'white',
                    borderRadius: '10px',
                    fontSize: '12px'
                  }}>
                    {(summary.consensus_level * 100).toFixed(0)}%
                  </span>
                </div>
                <div>
                  <strong>統合信頼度:</strong>
                  <span style={{ marginLeft: '6px', fontWeight: 'bold', color: '#2e7d32' }}>
                    {(summary.confidence_score * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>
          )}

          <div style={{ marginBottom: '15px' }}>
            <h4 style={{ margin: '0 0 8px 0', color: '#007bff' }}>📋 患者状況要約</h4>
            <p style={{ margin: 0, lineHeight: '1.5', backgroundColor: 'white', padding: '10px', borderRadius: '4px' }}>
              {summary.summary}
            </p>
            <small style={{ color: '#6c757d' }}>
              信頼度: {(summary.confidence_score * 100).toFixed(0)}% |
              生成時間: {new Date(summary.generated_at).toLocaleTimeString()}
              {summary.is_ensemble && ` | モデル数: ${summary.individual_model_results?.length || 0}`}
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
                      <div style={{ fontSize: '13px', color: '#007bff', marginBottom: diagnosis.model_agreement ? '4px' : '0' }}>
                        推奨検査: {diagnosis.additional_tests.join(', ')}
                      </div>
                    )}
                    {/* アンサンブル診断の場合、モデル間の合意を表示 */}
                    {summary.is_ensemble && diagnosis.model_agreement && diagnosis.model_agreement.length > 0 && (
                      <div style={{ fontSize: '12px', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ color: '#495057', fontWeight: 'bold' }}>✓ モデル合意:</span>
                        {diagnosis.model_agreement.map((model, idx) => (
                          <span key={idx} style={{
                            backgroundColor: '#e8f5e9',
                            color: '#2e7d32',
                            padding: '2px 6px',
                            borderRadius: '8px',
                            fontSize: '11px',
                            border: '1px solid #4caf50'
                          }}>
                            {model}
                          </span>
                        ))}
                        <span style={{ color: '#6c757d', fontSize: '11px' }}>
                          ({diagnosis.model_agreement.length}/{summary.individual_model_results?.length || 3}モデル)
                        </span>
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

          {/* アンサンブル診断の詳細情報 */}
          {summary.is_ensemble && summary.individual_model_results && summary.individual_model_results.length > 0 && (
            <div style={{ marginBottom: '15px' }}>
              <button
                onClick={() => setShowEnsembleDetails(!showEnsembleDetails)}
                style={{
                  width: '100%',
                  padding: '10px',
                  backgroundColor: '#f8f9fa',
                  border: '1px solid #dee2e6',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  color: '#495057'
                }}
              >
                <span>🔬 個別モデルの診断詳細</span>
                <span>{showEnsembleDetails ? '▼' : '▶'}</span>
              </button>

              {showEnsembleDetails && (
                <div style={{ marginTop: '10px', backgroundColor: 'white', padding: '15px', borderRadius: '4px', border: '1px solid #dee2e6' }}>
                  {summary.individual_model_results.map((model, idx) => (
                    <div key={idx} style={{
                      marginBottom: idx < summary.individual_model_results.length - 1 ? '15px' : '0',
                      paddingBottom: idx < summary.individual_model_results.length - 1 ? '15px' : '0',
                      borderBottom: idx < summary.individual_model_results.length - 1 ? '1px solid #e9ecef' : 'none'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <h6 style={{ margin: 0, color: '#495057' }}>
                          <span style={{ fontSize: '16px', marginRight: '6px' }}>
                            {idx === 0 ? '⚡' : idx === 1 ? '🚀' : '🌟'}
                          </span>
                          {model.model_name}
                        </h6>
                        <span style={{
                          backgroundColor: '#007bff',
                          color: 'white',
                          padding: '4px 10px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: 'bold'
                        }}>
                          信頼度 {(model.confidence_score * 100).toFixed(0)}%
                        </span>
                      </div>
                      <div style={{ fontSize: '13px', color: '#6c757d', lineHeight: '1.5', marginBottom: '8px' }}>
                        {model.summary}
                      </div>
                      {model.reasoning && (
                        <div style={{ fontSize: '12px', color: '#495057', backgroundColor: '#f8f9fa', padding: '8px', borderRadius: '4px', fontStyle: 'italic' }}>
                          💭 <strong>推論:</strong> {model.reasoning}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 統合推論の詳細 */}
          {summary.is_ensemble && summary.synthesis_reasoning && (
            <div style={{ marginBottom: '15px' }}>
              <button
                onClick={() => setShowSynthesisReasoning(!showSynthesisReasoning)}
                style={{
                  width: '100%',
                  padding: '10px',
                  backgroundColor: '#e8f5e9',
                  border: '1px solid #4caf50',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  color: '#2e7d32'
                }}
              >
                <span>🧠 Qwen Thinkingによる統合推論</span>
                <span>{showSynthesisReasoning ? '▼' : '▶'}</span>
              </button>

              {showSynthesisReasoning && (
                <div style={{
                  marginTop: '10px',
                  backgroundColor: 'white',
                  padding: '15px',
                  borderRadius: '4px',
                  border: '1px solid #4caf50',
                  fontSize: '13px',
                  color: '#495057',
                  lineHeight: '1.6'
                }}>
                  {summary.synthesis_reasoning}
                </div>
              )}
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