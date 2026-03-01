import { simpleGit, SimpleGit, GitError as SimpleGitError } from 'simple-git';

/**
 * Custom error class for Git operations
 */
export class GitError extends Error {
  constructor(message: string, public command?: string, public gitOutput?: string) {
    super(message);
    this.name = 'GitError';
  }
}

/**
 * Service for Git operations
 */
export class GitService {
  private git: SimpleGit;

  constructor(workingDirectory: string = process.cwd()) {
    this.git = simpleGit(workingDirectory);
  }

  /**
   * Check if current directory is a Git repository
   */
  async isGitRepository(): Promise<boolean> {
    try {
      await this.git.revparse(['--git-dir']);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Ensure we're in a Git repository
   */
  private async ensureGitRepository(): Promise<void> {
    const isRepo = await this.isGitRepository();
    if (!isRepo) {
      throw new GitError(
        'Not a Git repository. Please run this command from a Git repository.',
        'git rev-parse --git-dir'
      );
    }
  }

  /**
   * Get current branch name
   */
  async getCurrentBranch(): Promise<string | null> {
    try {
      await this.ensureGitRepository();
      const status = await this.git.status();
      return status.current || null;
    } catch (error) {
      if (error instanceof GitError) {
        throw error;
      }
      throw new GitError(
        'Failed to get current branch name',
        'git branch --show-current',
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  /**
   * Check if a branch exists locally
   */
  async branchExists(branchName: string): Promise<boolean> {
    try {
      await this.ensureGitRepository();
      const branches = await this.git.branchLocal();
      return branches.all.includes(branchName);
    } catch (error) {
      if (error instanceof GitError) {
        throw error;
      }
      throw new GitError(
        'Failed to check if branch exists',
        'git branch --list',
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  /**
   * Create a new branch from current HEAD
   */
  async createBranch(branchName: string): Promise<void> {
    try {
      await this.ensureGitRepository();

      // Check if branch already exists
      const exists = await this.branchExists(branchName);
      if (exists) {
        throw new GitError(
          `Branch '${branchName}' already exists`,
          'git checkout -b'
        );
      }

      // Create and switch to new branch
      await this.git.checkoutBranch(branchName, 'HEAD');
    } catch (error) {
      if (error instanceof GitError) {
        throw error;
      }

      // Handle simple-git errors
      if (error instanceof SimpleGitError) {
        throw new GitError(
          `Failed to create branch '${branchName}': ${error.message}`,
          'git checkout -b',
          error.message
        );
      }

      throw new GitError(
        `Failed to create branch '${branchName}'`,
        'git checkout -b',
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  /**
   * Switch to an existing branch
   */
  async switchToBranch(branchName: string): Promise<void> {
    try {
      await this.ensureGitRepository();

      // Check if branch exists
      const exists = await this.branchExists(branchName);
      if (!exists) {
        throw new GitError(
          `Branch '${branchName}' does not exist`,
          'git checkout'
        );
      }

      await this.git.checkout(branchName);
    } catch (error) {
      if (error instanceof GitError) {
        throw error;
      }

      // Handle simple-git errors
      if (error instanceof SimpleGitError) {
        throw new GitError(
          `Failed to switch to branch '${branchName}': ${error.message}`,
          'git checkout',
          error.message
        );
      }

      throw new GitError(
        `Failed to switch to branch '${branchName}'`,
        'git checkout',
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  /**
   * Delete a local branch
   */
  async deleteBranch(branchName: string, force = false): Promise<void> {
    try {
      await this.ensureGitRepository();

      // Check if we're currently on the branch we want to delete
      const currentBranch = await this.getCurrentBranch();
      if (currentBranch === branchName) {
        throw new GitError(
          `Cannot delete branch '${branchName}' because you are currently on it`,
          'git branch -d'
        );
      }

      // Check if branch exists
      const exists = await this.branchExists(branchName);
      if (!exists) {
        throw new GitError(
          `Branch '${branchName}' does not exist`,
          'git branch -d'
        );
      }

      // Delete branch
      await this.git.branch([force ? '-D' : '-d', branchName]);
    } catch (error) {
      if (error instanceof GitError) {
        throw error;
      }

      // Handle simple-git errors
      if (error instanceof SimpleGitError) {
        throw new GitError(
          `Failed to delete branch '${branchName}': ${error.message}`,
          'git branch -d',
          error.message
        );
      }

      throw new GitError(
        `Failed to delete branch '${branchName}'`,
        'git branch -d',
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  /**
   * Get repository status
   */
  async getStatus(): Promise<{
    current: string | null;
    files: Array<{ path: string; working_dir: string; index: string }>;
    ahead: number;
    behind: number;
  }> {
    try {
      await this.ensureGitRepository();
      const status = await this.git.status();

      return {
        current: status.current || null,
        files: status.files.map(file => ({
          path: file.path,
          working_dir: file.working_dir,
          index: file.index
        })),
        ahead: status.ahead,
        behind: status.behind
      };
    } catch (error) {
      if (error instanceof GitError) {
        throw error;
      }
      throw new GitError(
        'Failed to get repository status',
        'git status',
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  /**
   * Check if working directory is clean (no uncommitted changes)
   */
  async isWorkingDirectoryClean(): Promise<boolean> {
    try {
      const status = await this.getStatus();
      return status.files.length === 0;
    } catch (error) {
      if (error instanceof GitError) {
        throw error;
      }
      throw new GitError(
        'Failed to check working directory status',
        'git status',
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  /**
   * Get list of all local branches
   */
  async listBranches(): Promise<string[]> {
    try {
      await this.ensureGitRepository();
      const branches = await this.git.branchLocal();
      return branches.all;
    } catch (error) {
      if (error instanceof GitError) {
        throw error;
      }
      throw new GitError(
        'Failed to list branches',
        'git branch',
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  /**
   * Get the root directory of the Git repository
   */
  async getRepositoryRoot(): Promise<string> {
    try {
      await this.ensureGitRepository();
      const rootPath = await this.git.revparse(['--show-toplevel']);
      return rootPath.trim();
    } catch (error) {
      if (error instanceof GitError) {
        throw error;
      }
      throw new GitError(
        'Failed to get repository root',
        'git rev-parse --show-toplevel',
        error instanceof Error ? error.message : String(error)
      );
    }
  }
}