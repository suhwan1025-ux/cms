import React, { useState, useEffect } from 'react';
import { getApiUrl } from '../config/api';
import './DocumentTemplates.css';

const API_BASE_URL = getApiUrl();

// 하위 호환성을 위한 더미 export (필요시 제거 가능)
export const documentTemplates = {};

// 템플릿 선택 컴포넌트
const DocumentTemplates = ({ onSelectTemplate, selectedTemplate }) => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // DB에서 템플릿 목록 조회
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE_URL}/api/document-templates`);
        
        if (!response.ok) {
          throw new Error('템플릿 목록을 불러오는데 실패했습니다.');
        }
        
        const data = await response.json();
        setTemplates(data);
        setError(null);
      } catch (err) {
        console.error('템플릿 로드 오류:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTemplates();
  }, []);

  if (loading) {
    return (
      <div className="document-templates">
        <h4>📋 문서 템플릿 선택</h4>
        <p>템플릿을 불러오는 중...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="document-templates">
        <h4>📋 문서 템플릿 선택</h4>
        <p className="error-message">⚠️ {error}</p>
      </div>
    );
  }

  if (templates.length === 0) {
    return (
      <div className="document-templates">
        <h4>📋 문서 템플릿 선택</h4>
        <p>등록된 템플릿이 없습니다. 템플릿 관리에서 템플릿을 추가해주세요.</p>
      </div>
    );
  }

  return (
    <div className="document-templates">
      <h4>📋 문서 템플릿 선택</h4>
      <p>미리 작성된 템플릿을 선택하여 빠르게 문서를 작성하세요.</p>
      
      <div className="template-grid">
        {templates.map((template) => (
          <div 
            key={template.id}
            className={`template-card ${selectedTemplate === template.id ? 'selected' : ''}`}
            onClick={() => onSelectTemplate(template)}
          >
            <div className="template-header">
              <h5>{template.name}</h5>
              {selectedTemplate === template.id && (
                <span className="selected-badge">✓ 선택됨</span>
              )}
            </div>
            <p className="template-description">{template.description}</p>
            <button 
              className="template-button"
              onClick={(e) => {
                e.stopPropagation();
                onSelectTemplate(template);
              }}
            >
              이 템플릿 사용
            </button>
          </div>
        ))}
      </div>
      
      <div className="template-actions">
        <button 
          className="clear-template-button"
          onClick={() => onSelectTemplate(null)}
        >
          🗑️ 템플릿 초기화 (빈 문서로 시작)
        </button>
      </div>
    </div>
  );
};

export default DocumentTemplates;

/* 
 * 아래는 하드코딩된 기존 템플릿 데이터입니다.
 * 이미 DB로 마이그레이션되었으므로 참고용으로만 남겨둡니다.
 * 
 * OLD HARDCODED TEMPLATES:
 */
 
const OLD_TEMPLATES_FOR_REFERENCE = {
  promotion: {
    id: 'promotion',
    name: '추진품의',
    description: '사업 추진을 위한 품의서 템플릿',
    content: `
      <h1>사업 추진 품의서</h1>
      
      <h2>1. 추진 개요</h2>
      <table>
        <tr>
          <th style="width: 150px; background-color: #f8f9fa;">사업명</th>
          <td>[사업명을 입력하세요]</td>
        </tr>
        <tr>
          <th style="background-color: #f8f9fa;">추진 목적</th>
          <td>[추진 목적을 입력하세요]</td>
        </tr>
        <tr>
          <th style="background-color: #f8f9fa;">추진 기간</th>
          <td>[시작일] ~ [종료일]</td>
        </tr>
        <tr>
          <th style="background-color: #f8f9fa;">담당 부서</th>
          <td>[담당 부서명]</td>
        </tr>
      </table>

      <h2>2. 추진 배경</h2>
      <p>[추진 배경 및 필요성을 기술하세요]</p>

      <h2>3. 추진 내용</h2>
      <ul>
        <li><strong>주요 업무:</strong> [주요 업무 내용]</li>
        <li><strong>예상 성과:</strong> [예상되는 성과]</li>
        <li><strong>위험 요소:</strong> [예상 위험 요소 및 대응방안]</li>
      </ul>

      <h2>4. 소요 예산</h2>
      <table>
        <tr>
          <th style="background-color: #f8f9fa;">항목</th>
          <th style="background-color: #f8f9fa;">금액</th>
          <th style="background-color: #f8f9fa;">비고</th>
        </tr>
        <tr>
          <td>[예산 항목 1]</td>
          <td>[금액]</td>
          <td>[비고]</td>
        </tr>
        <tr>
          <td>[예산 항목 2]</td>
          <td>[금액]</td>
          <td>[비고]</td>
        </tr>
        <tr>
          <th style="background-color: #f8f9fa;">합계</th>
          <th>[총 금액]</th>
          <th></th>
        </tr>
      </table>

      <h2>5. 추진 일정</h2>
      <table>
        <tr>
          <th style="background-color: #f8f9fa;">단계</th>
          <th style="background-color: #f8f9fa;">기간</th>
          <th style="background-color: #f8f9fa;">주요 활동</th>
        </tr>
        <tr>
          <td>1단계</td>
          <td>[기간]</td>
          <td>[주요 활동]</td>
        </tr>
        <tr>
          <td>2단계</td>
          <td>[기간]</td>
          <td>[주요 활동]</td>
        </tr>
      </table>

      <p><strong>검토 의견:</strong></p>
      <p>위와 같이 추진하고자 하오니 검토 후 승인하여 주시기 바랍니다.</p>
    `
  },
  
  bidding: {
    id: 'bidding',
    name: '입찰 실시 품의서(표준)',
    description: '표준 입찰 실시 품의서 템플릿 (SOR, GPU, 차세대 주전산기 사례 기반)',
    content: `
      <div style="text-align: center; margin-bottom: 30px;">
        <h1>입찰 실시 품의서</h1>
      </div>

     
      <p style="margin: 30px 0 20px 0;">「[프로젝트명]」 수행업체 선정을 위해 아래와 같이 입찰을 실시하고자 하오니 재가하여 주시기 바랍니다.</p>

      <p style="text-align: center; font-weight: bold; margin: 30px 0;">- 아&nbsp;&nbsp;&nbsp;래 -</p>

      <h2>1. 목 적</h2>
      <p>[프로젝트의 핵심 목표를 간결하게 기술합니다.]</p>
      <p><em>예: 노후화된 고객상담시스템 교체 및 신규 비즈니스 지원 체계 구축</em></p>
      <ul>
        <li>[세부 목적 1]</li>
        <li>[세부 목적 2]</li>
        <li>[세부 목적 3]</li>
      </ul>

      <h2>2. 근 거</h2>
      <ul>
        <li>(추진기안) [문서번호] [관련 기안 제목]</li>
        <li>(협조전) [문서번호] [관련 협조전 제목]</li>
        <li>[기타 관련 문서]</li>
      </ul>

      <h2>3. 사업 예산</h2>
      <p><strong>총 [총예산 금액] 원 (VAT 포함)</strong></p>

      <h2>4. 입찰 및 계약 방식</h2>
      <ul>
        <li><strong>입찰 방식:</strong> [제한경쟁입찰 / 지명경쟁입찰 / 일반경쟁입찰 중 선택]</li>
        <li><strong>공고/통보 방식:</strong> [홈페이지 공고 / 지명 업체 공문 통보 등]</li>
        <li><strong>선정 방식:</strong> [업체 선정 방식 기술]
          <ul>
            <li>예시1: 기술평가 및 가격평가를 통한 우선협상대상자 선정</li>
            <li>예시2: 최저가 낙찰</li>
          </ul>
        </li>
        <li><strong>지명/제한 사유 (해당 시):</strong><br>
          [지명 또는 제한 경쟁을 하는 이유를 관련 규정에 근거하여 작성합니다.]<br>
          <em>예시: 계약의 성격상 특수한 기술이 필요하며, 국내 공식 총판을 통해서만 공급이 가능함</em>
        </li>
      </ul>

      <h2>5. 입찰 참가 자격</h2>
      <ul>
        <li>국가기관, 지방자치단체 등의 부적격 업체로 제재받고 있지 아니한 사업자</li>
        <li>업체 및 대표자가 은행연합회 불량거래처 등으로 등재되어 있지 아니한 사업자</li>
        <li>최근 [N년] 이내 [유사 사업 분야] 구축 실적을 보유한 사업자</li>
        <li>제조사의 '물품공급 및 기술지원 확약서' 제출이 가능한 사업자</li>
        <li>[기타 프로젝트 특성에 따른 자격 요건 추가]</li>
      </ul>

      <h2>6. 입찰 대상</h2>
      <figure class="table">
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr>
              <th style="background-color: #f8f9fa; padding: 10px; border: 1px solid #ddd;">구분</th>
              <th style="background-color: #f8f9fa; padding: 10px; border: 1px solid #ddd;">항목</th>
              <th style="background-color: #f8f9fa; padding: 10px; border: 1px solid #ddd;">수량</th>
              <th style="background-color: #f8f9fa; padding: 10px; border: 1px solid #ddd;">상세 내역</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd;">H/W</td>
              <td style="padding: 8px; border: 1px solid #ddd;">[예: GPU 서버]</td>
              <td style="padding: 8px; border: 1px solid #ddd;">[예: 2대]</td>
              <td style="padding: 8px; border: 1px solid #ddd;">[세부 모델명 또는 사양 기술, 예: B200]</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd;">S/W</td>
              <td style="padding: 8px; border: 1px solid #ddd;">[예: 상담 앱]</td>
              <td style="padding: 8px; border: 1px solid #ddd;">[예: 50식]</td>
              <td style="padding: 8px; border: 1px solid #ddd;">[주요 기능 등 기술]</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd;">기술지원</td>
              <td style="padding: 8px; border: 1px solid #ddd;">유지보수 및 기술지원</td>
              <td style="padding: 8px; border: 1px solid #ddd;">1식</td>
              <td style="padding: 8px; border: 1px solid #ddd;">[내용 요약]</td>
            </tr>
            <tr style="font-weight: bold;">
              <td style="padding: 8px; border: 1px solid #ddd; background-color: #f8f9fa;">합계</td>
              <td style="padding: 8px; border: 1px solid #ddd; background-color: #f8f9fa;">-</td>
              <td style="padding: 8px; border: 1px solid #ddd; background-color: #f8f9fa;">-</td>
              <td style="padding: 8px; border: 1px solid #ddd; background-color: #f8f9fa;">-</td>
            </tr>
          </tbody>
        </table>
      </figure>
      <p><em>※ 상세 내역은 '제안요청서' 참조</em></p>

      <h2>7. 평가 기준</h2>
      <ul>
        <li><strong>평가 방식:</strong> 기술평가( [배점] %) + 가격평가( [배점] %)</li>
        <li><em>예시: 기술평가 80% + 가격평가 20%</em></li>
        <li><strong>세부 사항:</strong> 기술평가 세부항목 및 배점은 첨부된 '기술평가표' 참조</li>
      </ul>

      <h2>8. 추진 일정</h2>
      <figure class="table">
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr>
              <th style="background-color: #f8f9fa; padding: 10px; border: 1px solid #ddd;">추진 단계</th>
              <th style="background-color: #f8f9fa; padding: 10px; border: 1px solid #ddd;">일정</th>
              <th style="background-color: #f8f9fa; padding: 10px; border: 1px solid #ddd;">예상 일자</th>
              <th style="background-color: #f8f9fa; padding: 10px; border: 1px solid #ddd;">비고</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd;">입찰 공고</td>
              <td style="padding: 8px; border: 1px solid #ddd;">D-Day</td>
              <td style="padding: 8px; border: 1px solid #ddd;">[YYYY-MM-DD]</td>
              <td style="padding: 8px; border: 1px solid #ddd;">홈페이지 공고</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd;">입찰 마감</td>
              <td style="padding: 8px; border: 1px solid #ddd;">D + [N]일</td>
              <td style="padding: 8px; border: 1px solid #ddd;">[YYYY-MM-DD]</td>
              <td style="padding: 8px; border: 1px solid #ddd;">방문 또는 우편 접수</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd;">제안 설명회 (필요시)</td>
              <td style="padding: 8px; border: 1px solid #ddd;">D + [N]일</td>
              <td style="padding: 8px; border: 1px solid #ddd;">[YYYY-MM-DD]</td>
              <td style="padding: 8px; border: 1px solid #ddd;">본사 26F</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd;">기술/가격 평가</td>
              <td style="padding: 8px; border: 1px solid #ddd;">D + [N]일</td>
              <td style="padding: 8px; border: 1px solid #ddd;">[YYYY-MM-DD]</td>
              <td style="padding: 8px; border: 1px solid #ddd;">우선협상대상자 선정</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd;">계약 체결</td>
              <td style="padding: 8px; border: 1px solid #ddd;">D + [N]일</td>
              <td style="padding: 8px; border: 1px solid #ddd;">[YYYY-MM-DD] ~</td>
              <td style="padding: 8px; border: 1px solid #ddd;"></td>
            </tr>
          </tbody>
        </table>
      </figure>


    `
  },

  biddingResult: {
    id: 'biddingResult',
    name: '입찰 결과 보고 품의',
    description: '입찰 결과 보고를 위한 품의서 템플릿',
    content: `
      <h1>입찰 결과 보고 품의서</h1>
      
      <h2>1. 입찰 개요</h2>
      <table>
        <tr>
          <th style="width: 150px; background-color: #f8f9fa;">입찰명</th>
          <td>[입찰 사업명]</td>
        </tr>
        <tr>
          <th style="background-color: #f8f9fa;">공고일</th>
          <td>[입찰 공고일]</td>
        </tr>
        <tr>
          <th style="background-color: #f8f9fa;">개찰일</th>
          <td>[입찰 개찰일]</td>
        </tr>
        <tr>
          <th style="background-color: #f8f9fa;">추정 가격</th>
          <td>[추정 가격] 원</td>
        </tr>
      </table>

      <h2>2. 입찰 참가 현황</h2>
      <table>
        <tr>
          <th style="background-color: #f8f9fa;">구분</th>
          <th style="background-color: #f8f9fa;">업체 수</th>
          <th style="background-color: #f8f9fa;">비고</th>
        </tr>
        <tr>
          <td>입찰 참가 업체</td>
          <td>[참가 업체 수]개 업체</td>
          <td></td>
        </tr>
        <tr>
          <td>유효 입찰</td>
          <td>[유효 입찰 수]개 업체</td>
          <td></td>
        </tr>
        <tr>
          <td>무효 입찰</td>
          <td>[무효 입찰 수]개 업체</td>
          <td>[무효 사유]</td>
        </tr>
      </table>

      <h2>3. 입찰 결과</h2>
      <table>
        <tr>
          <th style="background-color: #f8f9fa;">순위</th>
          <th style="background-color: #f8f9fa;">업체명</th>
          <th style="background-color: #f8f9fa;">입찰금액</th>
          <th style="background-color: #f8f9fa;">낙찰률</th>
          <th style="background-color: #f8f9fa;">비고</th>
        </tr>
        <tr>
          <td>1위</td>
          <td>[낙찰업체명]</td>
          <td>[낙찰금액] 원</td>
          <td>[낙찰률]%</td>
          <td>낙찰</td>
        </tr>
        <tr>
          <td>2위</td>
          <td>[업체명]</td>
          <td>[입찰금액] 원</td>
          <td>[비율]%</td>
          <td></td>
        </tr>
        <tr>
          <td>3위</td>
          <td>[업체명]</td>
          <td>[입찰금액] 원</td>
          <td>[비율]%</td>
          <td></td>
        </tr>
      </table>

      <h2>4. 낙찰자 선정 사유</h2>
      <p>[낙찰자 선정 근거와 사유를 상세히 기술하세요]</p>
      
      <ul>
        <li><strong>가격 경쟁력:</strong> [가격 관련 평가]</li>
        <li><strong>기술 능력:</strong> [기술적 우수성]</li>
        <li><strong>업체 신뢰도:</strong> [과거 실적 및 신뢰도]</li>
        <li><strong>기타 고려사항:</strong> [추가 고려사항]</li>
      </ul>

      <h2>5. 계약 조건</h2>
      <table>
        <tr>
          <th style="background-color: #f8f9fa;">항목</th>
          <th style="background-color: #f8f9fa;">내용</th>
        </tr>
        <tr>
          <td>계약금액</td>
          <td>[계약금액] 원 (부가세 포함)</td>
        </tr>
        <tr>
          <td>계약기간</td>
          <td>[계약 시작일] ~ [계약 종료일]</td>
        </tr>
        <tr>
          <td>납품일정</td>
          <td>[납품 예정일]</td>
        </tr>
        <tr>
          <td>지급조건</td>
          <td>[대금 지급 조건]</td>
        </tr>
      </table>

      <h2>6. 향후 일정</h2>
      <ul>
        <li><strong>계약 체결:</strong> [계약 예정일]</li>
        <li><strong>사업 착수:</strong> [착수 예정일]</li>
        <li><strong>완료 예정:</strong> [완료 예정일]</li>
      </ul>

      <p><strong>결론:</strong></p>
      <p>위와 같이 입찰을 실시한 결과 [낙찰업체명]을 낙찰자로 선정하였으니 검토 후 계약 체결을 승인하여 주시기 바랍니다.</p>
    `
  }
}; 