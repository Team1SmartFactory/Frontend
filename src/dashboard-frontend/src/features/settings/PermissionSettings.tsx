import { useState, type FormEvent } from 'react';
import { usePermissions, useUpdatePermissions } from '../../shared/query/useSettings';
import { Button, Card, Switch, TextField } from '../../shared/ui';
import styles from './PermissionSettings.module.css';

/** 설정 탭의 "로봇 제어 승인 권한 설정". */
export function PermissionSettings() {
  const { permissions, isPending } = usePermissions();
  const updatePermissions = useUpdatePermissions();

  const savedApprovers = permissions.authorizedApprovers.join(', ');
  const [approverInput, setApproverInput] = useState(savedApprovers);
  const [syncedFrom, setSyncedFrom] = useState(savedApprovers);

  /*
   * 서버 값이 늦게 도착하거나 다른 창에서 바뀌면 입력란을 따라가게 한다.
   * 단, 사용자가 편집 중이면 덮어쓰지 않는다.
   *
   * "직전에 반영한 서버 값"을 따로 들고 비교해야 그 둘을 구분할 수 있다.
   * 입력값이 비었는지로 판단하면(이전 구현) 첫 렌더에서 이미 폴백 값이
   * 채워져 있어 조건이 영영 성립하지 않고, 실제로 동작하는 경우는
   * 사용자가 입력란을 지웠을 때 멋대로 되채우는 것뿐이었다.
   *
   * prop 변화에 따른 state 조정은 effect가 아니라 렌더 중에 하는 것이
   * React 공식 권장이다 — 여분의 리렌더가 없다.
   */
  if (savedApprovers !== syncedFrom) {
    setSyncedFrom(savedApprovers);
    if (approverInput === syncedFrom) setApproverInput(savedApprovers);
  }

  const isDirty = approverInput.trim() !== savedApprovers;
  const isSaving = updatePermissions.isPending;

  function handleApproverSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const approvers = approverInput
      .split(',')
      .map((name) => name.trim())
      .filter(Boolean);
    updatePermissions.mutate({ ...permissions, authorizedApprovers: approvers });
  }

  return (
    <Card title="로봇 제어 승인 권한" subtitle="부족 감지 후 로봇을 어떻게 동작시킬지 결정합니다.">
      <div className={styles.body}>
        <Switch
          checked={permissions.approvalRequired}
          disabled={isPending || isSaving}
          onChange={(approvalRequired) =>
            updatePermissions.mutate({ ...permissions, approvalRequired })
          }
          label="관리자 승인 필수"
          description={
            permissions.approvalRequired
              ? '부족 발생 시 승인 팝업을 띄우고, 승인 후에만 로봇이 움직입니다.'
              : '승인 없이 로봇이 즉시 보충 작업을 시작합니다.'
          }
        />

        <form className={styles.form} onSubmit={handleApproverSubmit}>
          <TextField
            label="승인 권한 보유자"
            hint="쉼표로 구분해 입력합니다. 예: admin, manager"
            value={approverInput}
            disabled={isPending}
            onChange={(event) => setApproverInput(event.target.value)}
          />
          <Button type="submit" variant="primary" size="sm" disabled={!isDirty || isSaving}>
            {isSaving ? '저장 중…' : isDirty ? '저장' : '저장됨'}
          </Button>
        </form>

        {updatePermissions.isError && (
          <p className={styles.error} role="alert">
            설정을 저장하지 못했습니다. {updatePermissions.error.message}
          </p>
        )}
      </div>
    </Card>
  );
}
