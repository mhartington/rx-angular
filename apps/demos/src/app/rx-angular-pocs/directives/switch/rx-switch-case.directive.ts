import {
  ChangeDetectorRef,
  Directive,
  EmbeddedViewRef,
  forwardRef,
  Inject,
  Input,
  OnDestroy,
  OnInit,
  TemplateRef,
  ViewContainerRef
} from '@angular/core';
import { combineLatest, ReplaySubject, Subscription, Unsubscribable } from 'rxjs';
import { distinctUntilChanged, map, switchAll, tap } from 'rxjs/operators';
import { RxSwitch } from './rx-switch.directive';

// tslint:disable-next-line:directive-selector
@Directive({ selector: '[rxSwitchCase]' })
export class RxSwitchCase implements OnInit, OnDestroy {

  @Input()
  set rxSwitchCaseValue(o$) {
    this.observables$.next(o$);
  };

  @Input()
  set rxSwitchCase(o$) {
    this.observables$.next(o$);
  };
  observables$ = new ReplaySubject(1);

  caseValues$ = this.observables$
    .pipe(
      distinctUntilChanged(),
      switchAll(),
      distinctUntilChanged(),
      tap(v => this.caseValue = v)
    );
  private subscription: Unsubscribable = new Subscription();
  private _view: EmbeddedViewRef<any>;
  private inserted = false;
  private caseValue;

  constructor(
    private viewContainer: ViewContainerRef,
    public templateRef: TemplateRef<Object>,
    private cdRef: ChangeDetectorRef,
    @Inject(forwardRef(() => RxSwitch)) private rxSwitch: RxSwitch<any>
  ) {

  }

  ngOnInit() {
    this.createView();
    this.subscription = combineLatest([
      this.caseValues$,
      this.rxSwitch.values$
    ])
      .pipe(
        // tslint:disable-next-line:triple-equals
        map(([caseValue, switchValue]) => caseValue == switchValue),
        distinctUntilChanged(),
        tap((matched: boolean) => {
          if (matched) {
            if (!this.inserted) {
              this.viewContainer.insert(this._view, 0);
              this.inserted = true;
            }
          } else {
            if (this._view && this.inserted) {
              this.viewContainer.detach(0);
              this.inserted = false;
            }
          }
          this._view.context.$implicit = this.caseValue;
          this._view.detectChanges();
        })
      )
      .subscribe({ error: console.log });
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  private createView(): void {
    this._view = this.viewContainer.createEmbeddedView(
      this.templateRef,
      { $implicit: this.caseValue },
      0
    );
    this.viewContainer.detach(0);
  }

}
