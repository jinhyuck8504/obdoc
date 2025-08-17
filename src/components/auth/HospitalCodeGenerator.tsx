'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/Badge';
import { Separator } from '@/components/ui/separator';
import { 
  Loader2, 
  Copy, 
  Check, 
  Building2, 
  Shield, 
  Users, 
  Calendar,
  AlertCircle,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import * as hospitalCodeService from '@/lib/hospitalCodeService';
import { useToast } from '@/hooks/use-toast';

interface HospitalData {
  name: string;
  address: string;
  phone: string;
  adminEmail: string;
  description?: string;
  capacity?: number;
  specialties?: string[];
}

interface GeneratedCodeInfo {
  code: string;
  createdAt: string;
  expiresAt?: string;
  isActive: boolean;
  usageCount: number;
}

interface HospitalCodeGeneratorProps {
  onCodeGenerated?: (code: string, hospitalData: HospitalData) => void;
  onError?: (error: string) => void;
  className?: string;
}

export default function HospitalCodeGenerator({ 
  onCodeGenerated, 
  onError,
  className = ''
}: HospitalCodeGeneratorProps) {
  const { toast } = useToast();
  const [hospitalData, setHospitalData] = useState<HospitalData>({
    name: '',
    address: '',
    phone: '',
    adminEmail: '',
    description: '',
    capacity: undefined,
    specialties: []
  });
  
  const [generatedCodes, setGeneratedCodes] = useState<GeneratedCodeInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [copied, setCopied] = useState<string>('');
  const [validationStatus, setValidationStatus] = useState<{
    name: boolean;
    email: boolean;
    phone: boolean;
    address: boolean;
  }>({ name: false, email: false, phone: false, address: false });

  // 실시간 유효성 검사
  useEffect(() => {
    const validateField = (field: string, value: string) => {
      switch (field) {
        case 'name':
          return value.trim().length >= 2;
        case 'email':
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
        case 'phone':
          return /^[0-9-+()\\s]{8,}$/.test(value.replace(/\s/g, ''));
        case 'address':
          return value.trim().length >= 5;
        default:
          return false;
      }
    };

    setValidationStatus({
      name: validateField('name', hospitalData.name),
      email: validateField('email', hospitalData.adminEmail),
      phone: validateField('phone', hospitalData.phone),
      address: validateField('address', hospitalData.address)
    });
  }, [hospitalData]);

  const handleInputChange = (field: keyof HospitalData, value: string | number | string[]) => {
    setHospitalData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const validateForm = (): boolean => {
    const errors: string[] = [];
    
    if (!validationStatus.name) errors.push('병원명은 2자 이상이어야 합니다.');
    if (!validationStatus.email) errors.push('올바른 이메일 형식을 입력해주세요.');
    if (!validationStatus.phone) errors.push('올바른 전화번호 형식을 입력해주세요.');
    if (!validationStatus.address) errors.push('주소는 5자 이상이어야 합니다.');
    
    if (errors.length > 0) {
      setError(errors.join(' '));
      return false;
    }
    return true;
  };

  const checkDuplicateHospital = async (): Promise<boolean> => {
    setIsValidating(true);
    try {
      // 병원명과 이메일 중복 체크
      const isDuplicate = await hospitalCodeService.checkDuplicateHospital(
        hospitalData.name,
        hospitalData.adminEmail
      );
      
      if (isDuplicate) {
        setError('이미 등록된 병원명 또는 관리자 이메일입니다.');
        return false;
      }
      return true;
    } catch (err) {
      setError('중복 확인 중 오류가 발생했습니다.');
      return false;
    } finally {
      setIsValidating(false);
    }
  };

  const handleGenerateCode = async () => {
    if (!validateForm()) return;
    
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      // 중복 체크
      const isUnique = await checkDuplicateHospital();
      if (!isUnique) {
        setIsLoading(false);
        return;
      }

      const result = await hospitalCodeService.generateHospitalCode(hospitalData);
      
      if (result.success) {
        const newCodeInfo: GeneratedCodeInfo = {
          code: result.code!,
          createdAt: new Date().toISOString(),
          isActive: true,
          usageCount: 0
        };
        
        setGeneratedCodes(prev => [newCodeInfo, ...prev]);
        setSuccess(`병원 코드가 성공적으로 생성되었습니다!`);
        
        toast({
          title: "병원 코드 생성 완료",
          description: `코드: ${result.code}`,
        });
        
        onCodeGenerated?.(result.code!, hospitalData);
        
        // 폼 초기화 (선택사항)
        // resetForm();
      } else {
        const errorMsg = result.error || '병원 코드 생성에 실패했습니다.';
        setError(errorMsg);
        onError?.(errorMsg);
      }
    } catch (err) {
      const errorMsg = '병원 코드 생성 중 오류가 발생했습니다.';
      setError(errorMsg);
      onError?.(errorMsg);
      console.error('Hospital code generation error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(code);
      toast({
        title: "복사 완료",
        description: "병원 코드가 클립보드에 복사되었습니다.",
      });
      setTimeout(() => setCopied(''), 2000);
    } catch (err) {
      toast({
        title: "복사 실패",
        description: "코드 복사에 실패했습니다.",
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setHospitalData({
      name: '',
      address: '',
      phone: '',
      adminEmail: '',
      description: '',
      capacity: undefined,
      specialties: []
    });
    setError('');
    setSuccess('');
  };

  const isFormValid = Object.values(validationStatus).every(Boolean);

  return (
    <div className={`w-full max-w-4xl mx-auto space-y-6 ${className}`}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            병원 코드 생성
          </CardTitle>
          <CardDescription>
            새로운 병원을 등록하고 고유 코드를 생성합니다. 생성된 코드는 의료진 가입 시 사용됩니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 기본 정보 */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Shield className="h-4 w-4" />
              기본 정보
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="hospitalName" className="flex items-center gap-2">
                  병원명 *
                  {validationStatus.name && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                </Label>
                <Input
                  id="hospitalName"
                  placeholder="예: 서울대학교병원"
                  value={hospitalData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  disabled={isLoading || isValidating}
                  className={validationStatus.name ? 'border-green-500' : ''}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="adminEmail" className="flex items-center gap-2">
                  관리자 이메일 *
                  {validationStatus.email && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                </Label>
                <Input
                  id="adminEmail"
                  type="email"
                  placeholder="admin@hospital.com"
                  value={hospitalData.adminEmail}
                  onChange={(e) => handleInputChange('adminEmail', e.target.value)}
                  disabled={isLoading || isValidating}
                  className={validationStatus.email ? 'border-green-500' : ''}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="hospitalAddress" className="flex items-center gap-2">
                병원 주소 *
                {validationStatus.address && <CheckCircle2 className="h-4 w-4 text-green-500" />}
              </Label>
              <Input
                id="hospitalAddress"
                placeholder="예: 서울특별시 종로구 대학로 101"
                value={hospitalData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                disabled={isLoading || isValidating}
                className={validationStatus.address ? 'border-green-500' : ''}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="hospitalPhone" className="flex items-center gap-2">
                병원 전화번호 *
                {validationStatus.phone && <CheckCircle2 className="h-4 w-4 text-green-500" />}
              </Label>
              <Input
                id="hospitalPhone"
                placeholder="예: 02-2072-2114"
                value={hospitalData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                disabled={isLoading || isValidating}
                className={validationStatus.phone ? 'border-green-500' : ''}
              />
            </div>
          </div>

          {/* 추가 정보 (선택사항) */}
          <Separator />
          
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Users className="h-4 w-4" />
              추가 정보 (선택사항)
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="description">병원 설명</Label>
                <Input
                  id="description"
                  placeholder="예: 종합병원, 전문 진료과목 등"
                  value={hospitalData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  disabled={isLoading || isValidating}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="capacity">병상 수</Label>
                <Input
                  id="capacity"
                  type="number"
                  placeholder="예: 1000"
                  value={hospitalData.capacity || ''}
                  onChange={(e) => handleInputChange('capacity', parseInt(e.target.value) || undefined)}
                  disabled={isLoading || isValidating}
                />
              </div>
            </div>
          </div>

          {/* 에러 및 성공 메시지 */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          {/* 생성 버튼 */}
          <div className="flex gap-3">
            <Button 
              onClick={handleGenerateCode} 
              disabled={!isFormValid || isLoading || isValidating}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  생성 중...
                </>
              ) : isValidating ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  확인 중...
                </>
              ) : (
                <>
                  <Building2 className="mr-2 h-4 w-4" />
                  병원 코드 생성
                </>
              )}
            </Button>
            
            <Button 
              variant="outline" 
              onClick={resetForm}
              disabled={isLoading || isValidating}
            >
              초기화
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 생성된 코드 목록 */}
      {generatedCodes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              생성된 병원 코드
            </CardTitle>
            <CardDescription>
              최근 생성된 병원 코드들입니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {generatedCodes.map((codeInfo, index) => (
                <div key={index} className="p-4 bg-gray-50 rounded-lg border">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="text-2xl font-bold text-blue-600 font-mono">
                          {codeInfo.code}
                        </p>
                        <Badge variant={codeInfo.isActive ? "default" : "secondary"}>
                          {codeInfo.isActive ? '활성' : '비활성'}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">
                        생성일: {new Date(codeInfo.createdAt).toLocaleString('ko-KR')}
                      </p>
                      <p className="text-sm text-gray-600">
                        사용 횟수: {codeInfo.usageCount}회
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopyCode(codeInfo.code)}
                      className="flex items-center gap-2"
                    >
                      {copied === codeInfo.code ? (
                        <>
                          <Check className="h-4 w-4" />
                          복사됨
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4" />
                          복사
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}