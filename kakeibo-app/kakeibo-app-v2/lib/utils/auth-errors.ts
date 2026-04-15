const AUTH_ERROR_MAP: Record<string, string> = {
  "Invalid login credentials": "メールアドレスまたはパスワードが正しくありません",
  "Email not confirmed": "メールアドレスが確認されていません",
  "User already registered": "このメールアドレスは既に登録されています",
  "Password should be at least 6 characters":
    "パスワードは6文字以上で入力してください",
  "Unable to validate email address: invalid format":
    "メールアドレスの形式が正しくありません",
  "Email rate limit exceeded":
    "メール送信の制限に達しました。しばらく時間をおいてから再試行してください",
  "For security purposes, you can only request this after":
    "セキュリティのため、しばらく時間をおいてから再試行してください",
  "New password should be different from the old password.":
    "新しいパスワードは現在のパスワードと異なるものを設定してください",
};

export function translateAuthError(message: string): string {
  for (const [key, value] of Object.entries(AUTH_ERROR_MAP)) {
    if (message.includes(key)) {
      return value;
    }
  }
  return "認証エラーが発生しました。もう一度お試しください";
}
