import simpleGit, { type SimpleGit } from 'simple-git';

export class GitService {
  private git: SimpleGit;

  constructor(basePath?: string) {
    this.git = simpleGit(basePath);
  }

  async isGitRepository(): Promise<boolean> {
    try {
      await this.git.revparse(['--is-inside-work-tree']);
      return true;
    } catch {
      return false;
    }
  }

  async createAndCheckoutBranch(branchName: string): Promise<void> {
    await this.git.checkoutLocalBranch(branchName);
  }

  async checkoutBranch(branchName: string): Promise<void> {
    await this.git.checkout(branchName);
  }

  async branchExists(branchName: string): Promise<boolean> {
    const branches = await this.git.branchLocal();
    return branches.all.includes(branchName);
  }

  async hasUncommittedChanges(): Promise<boolean> {
    const status = await this.git.status();
    return !status.isClean();
  }

  async mergeToMain(branchName: string): Promise<void> {
    await this.git.checkout('main');
    await this.git.merge([branchName]);
  }

  async push(): Promise<void> {
    await this.git.push();
  }
}
