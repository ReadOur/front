import { useState } from "react";
import {
  Button, Input,
  Card, CardHeader, CardTitle, CardContent,
  Modal, Spinner, Badge, Avatar, Icon,
  Switch, Checkbox, Tooltip,
  ToastProvider, useToast
} from "@/components";

export default function ComponentsDemo() {
  return (
    <ToastProvider>
      <DemoInner />
    </ToastProvider>
  );
}

// 내부 실제 페이지 내용
function DemoInner() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [sw, setSw] = useState(false);
  const [agree, setAgree] = useState(false);
  const { show } = useToast();

  return (
    <div className="min-h-screen bg-[color:var(--color-bg)] text-[color:var(--color-text)]">
      {/* Header */}
      <div className="sticky top-0 z-[var(--z-sticky)] bg-[color:var(--color-bg)]/90 backdrop-blur border-b border-[color:var(--color-border)]">
        <div className="mx-auto max-w-5xl px-6 py-3 flex items-center gap-3">
          <Icon name="LayoutGrid" />
          <h1 className="text-[length:var(--text-2xl)] font-bold">Components Demo</h1>
        </div>
      </div>

      <div className="mx-auto max-w-5xl p-6 space-y-8">

        {/* Buttons */}
        <Card>
          <CardHeader><CardTitle>Button</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Button>Primary</Button>
              <Button color="secondary">Secondary</Button>
              <Button color="destructive">Destructive</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button leftIcon={<Icon name="Plus" />}>Left Icon</Button>
              <Button rightIcon={<Icon name="ArrowRight" />}>Right Icon</Button>
              <Button
                isLoading={loading}
                onClick={() => {
                  setLoading(true);
                  setTimeout(() => setLoading(false), 1000);
                }}
              >
                Loading
              </Button>
              <Button fullWidth>Full width</Button>
            </div>
          </CardContent>
        </Card>

        {/* Inputs */}
        <Card>
          <CardHeader><CardTitle>Input</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                label="이메일"
                placeholder="you@example.com"
                leftIcon={<Icon name="Mail" />}
                helperText="학교 메일 가능"
              />
              <Input
                label="닉네임"
                placeholder="별명"
                rightIcon={<Icon name="User" />}
                error={error}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={() => setError("닉네임은 2자 이상이어야 합니다.")}>에러 표시</Button>
              <Button variant="ghost" onClick={() => setError(undefined)}>에러 해제</Button>
            </div>
          </CardContent>
        </Card>

        {/* Switch / Checkbox / Tooltip */}
        <Card>
          <CardHeader><CardTitle>Switch / Checkbox / Tooltip</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-6">
              <Switch checked={sw} onChange={setSw} label={`알림 ${sw ? "ON" : "OFF"}`} />
              <Checkbox checked={agree} onChange={(e) => setAgree(e.target.checked)} label="약관 동의" />
              <Tooltip content="이 아이콘은 정보(Info)입니다.">
                <span className="inline-flex items-center cursor-pointer">
                  <Icon name="Info" />
                </span>
              </Tooltip>
            </div>
          </CardContent>
        </Card>

        {/* Badge / Avatar / Spinner */}
        <Card>
          <CardHeader><CardTitle>Badge / Avatar / Spinner</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Badge color="primary">NEW</Badge>
              <Badge color="secondary">HOT</Badge>
              <Badge color="danger">ERROR</Badge>
            </div>
            <div className="flex items-center gap-4">
              <Avatar name="Duguda Capstone" />
              <Avatar name="React Student" size="lg" />
              <Spinner label="로딩 중…" />
            </div>
          </CardContent>
        </Card>

        {/* Modal */}
        <Card>
          <CardHeader><CardTitle>Modal</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={() => setOpen(true)} leftIcon={<Icon name="Square" />}>모달 열기</Button>
          </CardContent>
        </Card>

        <Modal open={open} onClose={() => setOpen(false)} labelledBy="demo-modal-title">
          <div className="space-y-4">
            <h2 id="demo-modal-title" className="text-xl font-semibold">데모 모달</h2>
            <p className="text-[color:var(--color-text-muted)]">ESC 또는 배경 클릭으로 닫을 수 있습니다.</p>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setOpen(false)}>취소</Button>
              <Button leftIcon={<Icon name="Check" />} onClick={() => setOpen(false)}>확인</Button>
            </div>
          </div>
        </Modal>

        {/* Toast */}
        <Card>
          <CardHeader><CardTitle>Toast 알림</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => show({ title: "기본 알림" })}>기본</Button>
              <Button color="secondary" onClick={() => show({ title: "성공!", variant: "success" })}>성공</Button>
              <Button color="destructive" onClick={() => show({ title: "주의!", variant: "warning" })}>경고</Button>
              <Button color="destructive" onClick={() => show({ title: "에러 발생", variant: "error" })}>에러</Button>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
