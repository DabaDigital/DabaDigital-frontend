import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { I18nService } from '../../core/i18n/i18n.service';
import { DialogComponent } from './dialog.component';

@Component({
  selector: 'app-dialog-test-host',
  imports: [DialogComponent],
  template: `
    <button id="opener" type="button" (click)="open.set(true)">Open</button>
    @if (open()) {
      <app-dialog
        alert
        size="sm"
        heading="Delete this item?"
        description="This cannot be undone."
        [dismissible]="dismissible()"
        (dismissed)="onDismissed()"
      >
        <p>Atlas Platform</p>
        <button appDialogActions id="confirm" type="button">Delete</button>
      </app-dialog>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class DialogHost {
  readonly open = signal(false);
  readonly dismissible = signal(true);
  dismissals = 0;

  onDismissed(): void {
    this.dismissals += 1;
    this.open.set(false);
  }
}

describe('DialogComponent', () => {
  let fixture: ComponentFixture<DialogHost>;
  let host: HTMLElement;

  const dialog = (): HTMLDialogElement | null => host.querySelector('dialog');
  function openDialog(): HTMLDialogElement {
    const opener = host.querySelector<HTMLButtonElement>('#opener');
    opener?.focus();
    opener?.click();
    fixture.detectChanges();
    const element = dialog();
    if (!element) throw new Error('dialog not rendered');
    return element;
  }

  beforeAll(() => {
    // jsdom does not implement modal dialogs; only the open state matters here.
    HTMLDialogElement.prototype.showModal = function (this: HTMLDialogElement) {
      this.open = true;
    };
    HTMLDialogElement.prototype.close = function (this: HTMLDialogElement) {
      this.open = false;
    };
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [DialogHost] }).compileComponents();
    TestBed.inject(I18nService).setLocale('en');
    fixture = TestBed.createComponent(DialogHost);
    host = fixture.nativeElement as HTMLElement;
    fixture.detectChanges();
  });

  it('opens as a labelled alert dialog with its actions in the footer', async () => {
    const element = openDialog();
    await fixture.whenStable();
    expect(element.open).toBe(true);
    expect(element.getAttribute('role')).toBe('alertdialog');
    const title = host.querySelector(`#${element.getAttribute('aria-labelledby')}`);
    const description = host.querySelector(`#${element.getAttribute('aria-describedby')}`);
    expect(title?.textContent).toBe('Delete this item?');
    expect(description?.textContent).toBe('This cannot be undone.');
    expect(host.querySelector('footer #confirm')).not.toBeNull();
    expect(host.querySelector('.dialog__body')?.textContent).toContain('Atlas Platform');
  });

  it('is dismissed by Escape or the close button and gives focus back to its opener', () => {
    const element = openDialog();
    const cancel = new Event('cancel', { cancelable: true });
    element.dispatchEvent(cancel);
    fixture.detectChanges();
    expect(cancel.defaultPrevented).toBe(true);
    expect(fixture.componentInstance.dismissals).toBe(1);
    expect(dialog()).toBeNull();
    expect(document.activeElement?.id).toBe('opener');

    openDialog();
    host.querySelector<HTMLButtonElement>('[aria-label="Close"]')?.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.dismissals).toBe(2);
  });

  it('stays open while work is in flight', () => {
    fixture.componentInstance.dismissible.set(false);
    const element = openDialog();
    element.dispatchEvent(new Event('cancel', { cancelable: true }));
    fixture.detectChanges();
    expect(fixture.componentInstance.dismissals).toBe(0);
    expect(dialog()).not.toBeNull();
    expect(host.querySelector<HTMLButtonElement>('[aria-label="Close"]')?.disabled).toBe(true);
  });
});
