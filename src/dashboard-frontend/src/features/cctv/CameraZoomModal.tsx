import type { MouseEvent } from 'react';
import { Badge, Button, CameraFeed } from '../../shared/ui';
import type { Tone } from '../../shared/ui/tone';
import { CloseIcon } from '../../shared/ui/icons';
import { useEscapeKey } from '../../shared/hooks/useEscapeKey';
import styles from './CameraZoomModal.module.css';

interface CameraZoomModalProps {
  cameraId: string;
  label: string;
  /** 경보 단계색: critical(부족)·accent(보충 중). 없으면 강조하지 않는다 (이슈 #40). */
  alertTone?: Tone;
  alertLabel?: string;
  streamUrl?: string;
  scopeTag?: string;
  onClose: () => void;
}

/** 카메라 뷰 클릭 시 열리는 확대 팝업. 배경 클릭과 Esc로도 닫힌다. */
export function CameraZoomModal({
  cameraId,
  label,
  alertTone,
  alertLabel,
  streamUrl,
  scopeTag,
  onClose,
}: CameraZoomModalProps) {
  useEscapeKey(onClose);

  /** 다이얼로그 내부 클릭이 배경까지 올라가 창을 닫아 버리는 것을 막는다. */
  function handleBackdropClick(event: MouseEvent<HTMLDivElement>): void {
    if (event.target === event.currentTarget) onClose();
  }

  return (
    <div className={styles.overlay} onClick={handleBackdropClick}>
      <div className={styles.dialog} role="dialog" aria-modal="true" aria-label={`${label} 확대 화면`}>
        <header className={styles.header}>
          <div className={styles.titleRow}>
            <h2 className={styles.title}>{label}</h2>
            <span className={styles.cameraId}>{cameraId}</span>
          </div>
          <div className={styles.headerActions}>
            {alertTone && alertLabel && (
              <Badge tone={alertTone} led pulse>
                {alertLabel}
              </Badge>
            )}
            <Button variant="ghost" size="sm" onClick={onClose} aria-label="닫기">
              <CloseIcon size={1.2} />
            </Button>
          </div>
        </header>

        <div className={styles.body}>
          <CameraFeed
            cameraId={cameraId}
            label={label}
            tone={alertTone}
            alertLabel={alertLabel}
            streamUrl={streamUrl}
            scopeTag={scopeTag}
          />
        </div>
      </div>
    </div>
  );
}
