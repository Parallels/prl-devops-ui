import { BehaviorSubject, Observable } from 'rxjs';
import { Toast, ToastAction } from '@prl/ui-kit';

// Define interfaces for our API parameters
export interface BaseToastOptions {
  id?: string;
  message: string | React.ReactNode;
  details?: string | React.ReactNode;
  actions?: ToastAction[];
  autoClose?: boolean;
  autoCloseDuration?: number;
  dismissible?: boolean;
}

export interface ProgressToastOptions extends BaseToastOptions {
  percent?: number;
  label?: string;
  showIcon?: boolean;
  status?: 'running' | 'paused' | 'completed' | 'error';
  type?: 'info' | 'success' | 'warning' | 'error';
  indeterminate?: boolean;
}

/**
 * Service for managing toast notifications that can be triggered from anywhere in the UI
 */
class ToastService {
  private static instance: ToastService;
  private toastSubject = new BehaviorSubject<Toast | null>(null);
  private activeToasts = new Map<string, Toast>(); // Track active toasts by ID
  private toastCounter = 0; // Counter to ensure unique keys

  private constructor() { }

  public static getInstance(): ToastService {
    if (!ToastService.instance) {
      ToastService.instance = new ToastService();
    }
    return ToastService.instance;
  }

  /**
   * Generate a unique ID for a toast
   */
  private generateToastId(): string {
    this.toastCounter += 1;
    return `ui_toast_${Date.now()}_${this.toastCounter}_${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Show or update a toast notification
   * @param options Toast configuration options
   * @returns The ID of the created or updated toast
   */
  public showToast(options: Omit<Toast, 'id' | 'timestamp'> & { id?: string; timestamp?: number }): string {
    const id = options.id ?? this.generateToastId();

    // DEBUGGING: Log the caller stack trace to find where undefined messages come from
    if (options.message === undefined || options.message === 'undefined') {
      console.warn('⚠️ TOAST WITH UNDEFINED MESSAGE:', {
        options,
        stack: new Error().stack,
      });
    }

    // Create the final toast object
    const finalToast: Toast = {
      ...options,
      id,
      timestamp: options.timestamp ?? Date.now(),
      _updateTimestamp: Date.now(),
    };

    // DEBUGGING: Log all toast creation
    console.info(`📣 Creating/updating toast [${id}]:`, {
      message: finalToast.message,
      type: finalToast.type,
      source: new Error().stack?.split('\n')[2]?.trim(), // Get caller
    });

    // Store in our active toasts map
    this.activeToasts.set(id, finalToast);

    // Emit the toast via our observable
    this.toastSubject.next(finalToast);

    return id;
  }

  /**
   * Update a toast's properties
   * @param id The ID of the toast to update
   * @param updates Partial properties to update
   * @returns boolean indicating whether the toast was found and updated
   */
  public updateToast(id: string, updates: Partial<Omit<Toast, 'id'>>): boolean {
    const existingToast = this.activeToasts.get(id);

    if (!existingToast) {
      console.warn(`Cannot update toast with ID ${id}: Not found`);
      return false;
    }

    const updatedToast: Toast = {
      ...existingToast,
      ...updates,
      id,
      _updateTimestamp: Date.now(),
    };

    this.activeToasts.set(id, updatedToast);
    this.toastSubject.next(updatedToast);

    return true;
  }

  /**
   * Update a progress toast
   * @param options Configuration for the progress update
   * @returns boolean indicating whether the toast was found and updated
   */
  public updateProgress(options: {
    id: string;
    percent: number;
    status?: 'running' | 'paused' | 'completed' | 'error';
    message?: string | React.ReactNode;
    details?: string | React.ReactNode;
  }): boolean {
    const { id, percent, status, message, details } = options;
    const existingToast = this.activeToasts.get(id);

    if (!existingToast || !existingToast.progress) {
      console.warn(
        `Cannot update progress for toast with ID ${id}: Not found or not a progress toast`
      );
      return false;
    }

    const updates: Partial<Toast> = {
      progress: {
        ...existingToast.progress,
        percent,
        ...(status && { status }),
      },
      _updateTimestamp: Date.now(),
    };

    if (message !== undefined) updates.message = message;
    if (details !== undefined) updates.details = details;

    // If progress reaches 100%, automatically set status to completed
    if (percent >= 100 && !status) {
      updates.progress!.status = 'completed';
    }

    return this.updateToast(id, updates);
  }

  public updateType(id: string, type: 'info' | 'success' | 'warning' | 'error'): boolean {
    return this.updateToast(id, { type });
  }

  /**
   * Mark a toast as removed (called by ToastManager)
   * @param id The ID of the toast that was removed
   */
  public markToastRemoved(id: string): void {
    this.activeToasts.delete(id);
  }

  /**
   * Show an error toast
   * @param options Toast configuration options
   * @returns The ID of the created toast
   */
  public showError(options: BaseToastOptions): string {
    return this.showToast({ ...options, type: 'error' });
  }

  /**
   * Show a warning toast
   * @param options Toast configuration options
   * @returns The ID of the created toast
   */
  public showWarning(options: BaseToastOptions): string {
    return this.showToast({ ...options, type: 'warning' });
  }

  /**
   * Show an info toast
   * @param options Toast configuration options
   * @returns The ID of the created toast
   */
  public showInfo(options: BaseToastOptions): string {
    return this.showToast({ ...options, type: 'info' });
  }

  /**
   * Show a success toast
   * @param options Toast configuration options
   * @returns The ID of the created toast
   */
  public showSuccess(options: BaseToastOptions): string {
    return this.showToast({ ...options, type: 'success' });
  }

  /**
   * Show a progress toast
   * @param options Progress toast configuration options
   * @returns The ID of the created toast
   */
  public showProgress(options: ProgressToastOptions): string {
    return this.showToast({
      ...options,
      type: options.type ?? 'info',
      label: options.label,
      showIcon: options.showIcon ?? true,
      autoClose: options.autoClose ?? false, // Default to false for progress toasts
      progress: {
        percent: options.percent ?? 0,
        status: options.status ?? 'running',
        indeterminate: options.indeterminate ?? false,
      },
    });
  }

  /**
   * Show a loading toast with indeterminate progress
   * @param options Toast configuration options
   * @returns The ID of the created toast
   */
  public showLoading(options: BaseToastOptions): string {
    return this.showToast({
      ...options,
      type: 'info',
      autoClose: options.autoClose ?? false, // Default to false for loading toasts
      progress: {
        percent: 0,
        status: 'running',
        indeterminate: true,
      },
    });
  }

  /**
   * Get an observable of toast notifications
   */
  public getToasts(): Observable<Toast | null> {
    return this.toastSubject.asObservable();
  }

  /**
   * Clear/remove a toast by its ID
   * @param id The ID of the toast to remove
   * @returns boolean indicating whether a toast was found and removed
   */
  public clearToast(id: string): boolean {
    // Check if toast exists
    if (!this.activeToasts.has(id)) {
      console.warn(`Toast with ID ${id} not found for removal`);
      return false;
    }

    console.info(`Clearing toast with ID: ${id}`);

    // Create a special removal notification with the _remove flag
    const removalToast: Toast = {
      id,
      message: '',
      type: 'info',
      timestamp: Date.now(),
      _remove: true,
    };

    // First, emit the removal signal
    this.toastSubject.next(removalToast);

    // Then remove from our active toasts map
    this.activeToasts.delete(id);

    return true;
  }

  /**
   * Clear all currently active toasts
   * @returns The number of toasts that were cleared
   */
  public clearAllToasts(): number {
    const count = this.activeToasts.size;
    const toastIds = Array.from(this.activeToasts.keys());

    // Clear each toast individually
    toastIds.forEach((id) => this.clearToast(id));

    return count;
  }

  /**
   * Get all active toast IDs (useful for debugging)
   */
  public getActiveToastIds(): string[] {
    return Array.from(this.activeToasts.keys());
  }

  public hasToast(id: string): boolean {
    return this.activeToasts.has(id);
  }
}

export const toastService = ToastService.getInstance();

export default toastService;
