import React, { useState } from 'react';
import enhancedClinicalAPI from '../services/enhancedClinicalAPI';

const ClinicalValidationChecker = ({ 
  patientSummary, 
  assessment, 
  plan, 
  diagnosisCodes = [],
  onValidationResult,
  disabled = false 
}) => {
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState(null);
  const [error, setError] = useState(null);

  const canValidate = patientSummary && assessment && plan && 
                     patientSummary.trim() && assessment.trim() && plan.trim();

  const performValidation = async () => {
    if (!canValidate || disabled) return;

    setIsValidating(true);
    setError(null);

    try {
      const validationData = {
        patient_summary: patientSummary,
        assessment: assessment,
        plan: plan,
        diagnosis_codes: diagnosisCodes
      };

      const result = await enhancedClinicalAPI.validateClinicalReasoning(validationData);
      
      if (result.status === 'success') {
        setValidationResult(result);
        if (onValidationResult) {
          onValidationResult(result);
        }
      } else {
        throw new Error('整合性チェックに失敗しました');
      }
    } catch (err) {
      console.error('Validation error:', err);
      setError(err.message || '整合性チェック中にエラーが発生しました');
    } finally {
      setIsValidating(false);
    }
  };

  const getValidationStatusColor = (isConsistent, score) => {
    if (!isConsistent) return '#dc3545'; // 赤
    if (score >= 0.8) return '#28a745'; // 緑
    if (score >= 0.6) return '#ffc107'; // 黄
    return '#6c757d'; // グレー
  };

  const getValidationStatusText = (isConsistent, score) => {
    if (!isConsistent) return '不整合あり';
    if (score >= 0.8) return '高い整合性';
    if (score >= 0.6) return '適度な整合性';
    return '要確認';
  };

  return (
    <div className="clinical-validation-checker" style={{ marginTop: '20px', padding: '15px', border: '1px solid #ddd', borderRadius: '8px', backgroundColor: '#f8f9fa' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '15px' }}>
        <h3 style={{ margin: 0, color: '#333' }}>🔍 A&P整合性チェック</h3>
        <button
          onClick={performValidation}
          disabled={!canValidate || disabled || isValidating}
          style={{
            padding: '8px 16px',
            backgroundColor: canValidate && !disabled ? '#17a2b8' : '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: canValidate && !disabled ? 'pointer' : 'not-allowed',
            fontSize: '14px'
          }}
          data-testid="validate-reasoning-button"
        >
          {isValidating ? 'チェック中...' : '整合性チェック'}
        </button>
      </div>

      {!canValidate && (
        <div style={{ padding: '10px', backgroundColor: '#fff3cd', border: '1px solid #ffeaa7', borderRadius: '4px', marginBottom: '10px' }}>
          <small style={{ color: '#856404' }}>
            患者状況要約、Assessment（評価）、Plan（計画）をすべて入力してください
          </small>
        </div>
      )}

      {error && (
        <div style={{ padding: '10px', backgroundColor: '#f8d7da', border: '1px solid #f5c6cb', borderRadius: '4px', marginBottom: '10px' }}>
          <strong style={{ color: '#721c24' }}>エラー:</strong> {error}
        </div>
      )}

      {validationResult && (
        <div className="validation-results" data-testid="validation-results">
          <div style={{ marginBottom: '15px' }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              backgroundColor: 'white',
              padding: '12px',
              borderRadius: '6px',
              border: `2px solid ${getValidationStatusColor(validationResult.validation_result.is_consistent, validationResult.validation_result.consistency_score)}`
            }}>
              <div>
                <h4 style={{ margin: '0 0 4px 0', color: '#333' }}>
                  {getValidationStatusText(validationResult.validation_result.is_consistent, validationResult.validation_result.consistency_score)}
                </h4>
                <p style={{ margin: 0, fontSize: '14px', color: '#6c757d' }}>
                  {validationResult.validation_result.validation_summary}
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ 
                  fontSize: '24px', 
                  fontWeight: 'bold',
                  color: getValidationStatusColor(validationResult.validation_result.is_consistent, validationResult.validation_result.consistency_score)
                }}>
                  {(validationResult.validation_result.consistency_score * 100).toFixed(0)}%
                </div>
                <small style={{ color: '#6c757d' }}>整合性スコア</small>
              </div>
            </div>
          </div>

          {validationResult.validation_result.inconsistencies && validationResult.validation_result.inconsistencies.length > 0 && (
            <div style={{ marginBottom: '15px' }}>
              <h5 style={{ margin: '0 0 8px 0', color: '#dc3545' }}>⚠️ 検出された不整合</h5>
              <div style={{ backgroundColor: 'white', padding: '10px', borderRadius: '4px' }}>
                {validationResult.validation_result.inconsistencies.map((inconsistency, index) => (
                  <div key={index} style={{ 
                    marginBottom: '8px', 
                    padding: '8px', 
                    border: '1px solid #f8d7da', 
                    borderRadius: '4px',
                    backgroundColor: '#fff5f5'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                      <strong style={{ color: '#721c24' }}>{inconsistency.type || '不整合'}</strong>
                      <span style={{ 
                        backgroundColor: inconsistency.severity === 'critical' ? '#dc3545' : 
                                       inconsistency.severity === 'high' ? '#fd7e14' :
                                       inconsistency.severity === 'medium' ? '#ffc107' : '#6c757d',
                        color: 'white',
                        padding: '2px 6px',
                        borderRadius: '10px',
                        fontSize: '11px'
                      }}>
                        {inconsistency.severity || 'medium'}
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: '13px', color: '#721c24' }}>
                      {inconsistency.description}
                    </p>
                    {inconsistency.location && (
                      <small style={{ color: '#6c757d' }}>場所: {inconsistency.location}</small>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {validationResult.validation_result.suggestions && validationResult.validation_result.suggestions.length > 0 && (
            <div style={{ marginBottom: '15px' }}>
              <h5 style={{ margin: '0 0 8px 0', color: '#007bff' }}>💡 改善提案</h5>
              <ul style={{ margin: 0, paddingLeft: '20px', backgroundColor: 'white', padding: '10px', borderRadius: '4px' }}>
                {validationResult.validation_result.suggestions.map((suggestion, index) => (
                  <li key={index} style={{ marginBottom: '6px', color: '#333' }}>{suggestion}</li>
                ))}
              </ul>
            </div>
          )}

          {validationResult.validation_result.missing_elements && validationResult.validation_result.missing_elements.length > 0 && (
            <div style={{ marginBottom: '15px' }}>
              <h5 style={{ margin: '0 0 8px 0', color: '#fd7e14' }}>📋 検討漏れの可能性</h5>
              <ul style={{ margin: 0, paddingLeft: '20px', backgroundColor: 'white', padding: '10px', borderRadius: '4px' }}>
                {validationResult.validation_result.missing_elements.map((element, index) => (
                  <li key={index} style={{ marginBottom: '6px', color: '#333' }}>{element}</li>
                ))}
              </ul>
            </div>
          )}

          <div style={{ 
            padding: '10px', 
            backgroundColor: validationResult.recommendation === 'high' ? '#d4edda' : 
                            validationResult.recommendation === 'medium' ? '#fff3cd' : '#f8d7da',
            border: `1px solid ${validationResult.recommendation === 'high' ? '#c3e6cb' : 
                                 validationResult.recommendation === 'medium' ? '#ffeaa7' : '#f5c6cb'}`,
            borderRadius: '4px',
            fontSize: '13px'
          }}>
            <strong>推奨レベル: </strong>
            {validationResult.recommendation === 'high' ? '✅ 承認推奨' :
             validationResult.recommendation === 'medium' ? '🔍 要注意' : '⚠️ 要見直し'}
          </div>
        </div>
      )}
    </div>
  );
};

export default ClinicalValidationChecker;