import * as React from "react";
import { observer } from "mobx-react";
import S from "./DateTimeEditor.module.scss";
// import CS from "./CommonStyle.module.css";
import { action, computed, observable, runInAction } from "mobx";
import moment, { Moment } from "moment";
import { Tooltip } from "react-tippy";
import { Dropdowner } from "gui/Components/Dropdowner/Dropdowner";
import DateCompleter from "./DateCompleter";
import { getLocaleFromCookie } from "../../../../utils/cookies";
import cx from "classnames";
import { IFocusAble } from "../../../../model/entities/FocusManager";

@observer
class CalendarWidget extends React.Component<{
  initialDisplayDate?: moment.Moment;
  selectedDay?: moment.Moment;
  onDayClick?(event: any, day: moment.Moment): void;
}> {
  @observable.ref displayedMonth = moment(this.props.initialDisplayDate).startOf("month");

  getDayHeaders() {
    const result: any[] = [];
    for (
      let day = moment(this.displayedMonth).startOf("week"), i = 0;
      i < 7;
      day.add({ days: 1 }), i++
    ) {
      result.push(<div className={S.calendarWidgetDayHeaderCell}>{day.format("dd")[0]}</div>);
    }
    return result;
  }

  getDates(weekInc: number) {
    const result: any[] = [];
    const today = moment();
    for (
      let day = moment(this.displayedMonth).startOf("week").add({ weeks: weekInc }), i = 0;
      i < 7;
      day.add({ days: 1 }), i++
    ) {
      const isNeighbourMonth = day.month() !== this.displayedMonth.month();
      const isSelectedDay = day.isSame(this.props.selectedDay, "day");
      const isToday = day.isSame(today, "days");
      const dayCopy = moment(day);
      result.push(
        <div
          className={cx(S.calendarWidgetCell, {
            [S.calendarWidgetNeighbourMonthCell]: isNeighbourMonth,
            [S.calendarWidgetSelectedDay]: isSelectedDay,
            isToday,
          })}
          onClick={(event: any) => this.handleDayClick(event, dayCopy)}
        >
          {day.format("D")}
        </div>
      );
    }
    return result;
  }

  getDateRows() {
    const result: any[] = [];
    for (let i = 0; i < 6; i++) {
      result.push(<div className={S.calendarWidgetRow}>{this.getDates(i)}</div>);
    }
    return result;
  }

  @action.bound
  handleMonthDecClick(event: any) {
    this.displayedMonth = moment(this.displayedMonth).subtract({ months: 1 });
  }

  @action.bound
  handleMonthIncClick(event: any) {
    this.displayedMonth = moment(this.displayedMonth).add({ months: 1 });
  }

  @action.bound
  handleYearDecClick(event: any) {
    this.displayedMonth = moment(this.displayedMonth).subtract({ years: 1 });
  }

  @action.bound
  handleYearIncClick(event: any) {
    this.displayedMonth = moment(this.displayedMonth).add({ years: 1 });
  }

  @action.bound handleDayClick(event: any, day: moment.Moment) {
    this.props.onDayClick && this.props.onDayClick(event, day);
  }

  render() {
    return (
      <div className={S.calendarWidgetContainer}>
        <div className={S.calendarWidgetDayTable}>
          <div className={S.calendarWidgetRow}>
            <div className={S.calendarWidgetHeader}>
              <div className={S.calendarWidgetMonthControls}>
                <button className={S.calendarWidgetControlBtn} onClick={this.handleMonthDecClick}>
                  <i className="fas fa-caret-left" />
                </button>
                <button className={S.calendarWidgetControlBtn} onClick={this.handleMonthIncClick}>
                  <i className="fas fa-caret-right" />
                </button>
              </div>
              <div className={S.calendarWidgetTitle}>{this.displayedMonth.format("MMMM YYYY")}</div>
              <div className={S.calendarWidgetYearControls}>
                <button className={S.calendarWidgetControlBtn} onClick={this.handleYearDecClick}>
                  <i className="fas fa-caret-down" />
                </button>
                <button className={S.calendarWidgetControlBtn} onClick={this.handleYearIncClick}>
                  <i className="fas fa-caret-up" />
                </button>
              </div>
            </div>
          </div>
          <div className={S.calendarWidgetRow}>{this.getDayHeaders()}</div>
          {this.getDateRows()}
        </div>
      </div>
    );
  }
}

@observer
export class DateTimeEditor extends React.Component<{
  value: string | null;
  outputFormat: string;
  isReadOnly?: boolean;
  isInvalid?: boolean;
  invalidMessage?: string;
  isFocused?: boolean;
  foregroundColor?: string;
  backgroundColor?: string;
  onChange?: (event: any, isoDay: string | undefined | null) => void;
  onChangeByCalendar?: (event: any, isoDay: string) => void;
  onClick?: (event: any) => void;
  onDoubleClick?: (event: any) => void;
  onKeyDown?: (event: any) => void;
  onEditorBlur?: (event: any) => void;
  refocuser?: (cb: () => void) => () => void;
  subscribeToFocusManager?: (obj: IFocusAble) => void;
}> {
  @observable isDroppedDown = false;

  refDropdowner = (elm: Dropdowner | null) => (this.elmDropdowner = elm);
  elmDropdowner: Dropdowner | null = null;

  @action.bound handleDropperClick(event: any) {
    event.stopPropagation();
    this.makeDroppedDown();
  }

  @action.bound makeDroppedDown() {
    if (!this.isDroppedDown) {
      this.isDroppedDown = true;
      window.addEventListener("click", this.handleWindowClick);
    }
  }

  @action.bound makeDroppedUp() {
    if (this.isDroppedDown) {
      this.isDroppedDown = false;
      window.removeEventListener("click", this.handleWindowClick);
    }
  }

  @action.bound handleWindowClick(event: any) {
    if (this.elmContainer && !this.elmContainer.contains(event.target)) {
      this.makeDroppedUp();
    }
  }

  disposers: any[] = [];

  componentDidMount() {
    this.props.refocuser && this.disposers.push(this.props.refocuser(this.makeFocusedIfNeeded));
    this.makeFocusedIfNeeded();
    if (this.elmInput && this.props.subscribeToFocusManager) {
      this.props.subscribeToFocusManager(this.elmInput);
    }
  }

  componentWillUnmount() {
    this.disposers.forEach((d) => d());
  }

  componentDidUpdate(prevProps: { isFocused?: boolean; value: string | null }) {
    runInAction(() => {
      if (!prevProps.isFocused && this.props.isFocused) {
        this.makeFocusedIfNeeded();
      }
      /*if (prevProps.textualValue !== this.props.textualValue) {
        this.dirtyTextualValue = undefined;
        this.makeFocusedIfNeeded();
      }*/

      if (prevProps.value !== null && this.props.value === null) {
        this.dirtyTextualValue = "";
      }
    });
  }

  @action.bound
  makeFocusedIfNeeded() {
    if (this.props.isFocused && this.elmInput) {
      this.elmInput.select();
      this.elmInput.scrollLeft = 0;
    }
  }

  @action.bound handleInputBlur(event: any) {
    const dateCompleter = this.getDateCompleter();
    const completedMoment = dateCompleter.autoComplete(this.dirtyTextualValue);
    if (completedMoment) {
      this.props.onChange?.(event, completedMoment.toISOString(true));
    } else if (this.momentValue?.isValid()) {
      this.props.onChange?.(event, this.momentValue?.toISOString(true));
    }

    this.dirtyTextualValue = undefined;
    this.props.onEditorBlur && this.props.onEditorBlur(event);
  }

  private get autoCompletedMoment(){
    const dateCompleter = this.getDateCompleter();
    return dateCompleter.autoComplete(this.dirtyTextualValue);
  }

  private get autocompletedText(){
    const completedMoment = this.autoCompletedMoment;
    if (completedMoment) {
      return this.formatMomentValue(this.autoCompletedMoment);
    }else{
      return this.formatMomentValue(this.momentValue);
    }
  }

  @action.bound handleKeyDown(event: any) {
    if (event.key === "Enter" || event.key === "Tab") {
      const completedMoment = this.autoCompletedMoment;
      if (completedMoment) {
        this.props.onChange?.(event, completedMoment.toISOString(true));
      } else if (this.momentValue?.isValid()) {
        this.props.onChange?.(event, this.momentValue?.toISOString(true));
      }
      this.dirtyTextualValue = undefined;
    }
    this.props.onKeyDown?.(event);
  }

  @action.bound getDateCompleter() {
    if (getLocaleFromCookie() === "en-US") {
      return new DateCompleter("MM/DD/YYYY h:mm:ss A", "/", ":", " ", () => moment());
    } else {
      return new DateCompleter("DD.MM.YYYY h:mm:ss", ".", ":", " ", () => moment());
    }
  }

  @action.bound handleContainerMouseDown(event: any) {
    setTimeout(() => {
      this.elmInput?.focus();
    }, 30);
  }

  refContainer = (elm: HTMLDivElement | null) => (this.elmContainer = elm);
  elmContainer: HTMLDivElement | null = null;
  refInput = (elm: HTMLInputElement | null) => (this.elmInput = elm);
  elmInput: HTMLInputElement | null = null;

  @observable dirtyTextualValue: string | undefined;

  get momentValue() {
    if (this.dirtyTextualValue) {
      return moment(this.dirtyTextualValue, this.props.outputFormat);
    }
    return !!this.props.value ? moment(this.props.value) : null;
  }

  formatMomentValue(value: Moment | null | undefined) {
    if (!value) return "";
    if (
      value.hour() === 0 &&
      value.minute() === 0 &&
      value.second() === 0
    ) {
      const expectedDateFormat = this.props.outputFormat.split(" ")[0];
      return value.format(expectedDateFormat);
    }
    return value.format(this.props.outputFormat);
  }

  get formattedMomentValue() {
    return this.formatMomentValue(this.momentValue);
  }

  @computed get textfieldValue() {
    return this.dirtyTextualValue !== undefined
      ? this.dirtyTextualValue
      : this.formattedMomentValue;
  }

  @computed get isTooltipShown() {
    return (
      this.textfieldValue !== undefined &&
      (!moment(this.textfieldValue, this.props.outputFormat) ||
        this.formattedMomentValue !== this.textfieldValue)
    );
  }

  @action.bound handleTextfieldChange(event: any) {
    this.dirtyTextualValue = event.target.value;
    if (this.dirtyTextualValue === "") {
      this.props.onChange && this.props.onChange(event, null);
      return;
    }
  }

  @action.bound handleDayClick(event: any, day: moment.Moment) {
    this.elmDropdowner && this.elmDropdowner.setDropped(false);
    this.dirtyTextualValue = undefined;
    this.props.onChangeByCalendar && this.props.onChangeByCalendar(event, day.toISOString(true));
    this.props.onChange && this.props.onChange(event, day.toISOString(true));
  }

  @action.bound
  handleFocus(event: any) {
    if (this.elmInput) {
      this.elmInput.select();
      this.elmInput.scrollLeft = 0;
    }
  }

  render() {
    return (
      <Dropdowner
        ref={this.refDropdowner}
        onContainerMouseDown={this.handleContainerMouseDown}
        trigger={({ refTrigger, setDropped }) => (
          <div
            className={S.editorContainer}
            ref={this.refContainer}
            style={{
              zIndex: this.isDroppedDown ? 1000 : undefined,
            }}
          >
            <Tooltip
              html={
                <div>
                  <div>{this.autocompletedText}</div>
                  <div>"{this.props.outputFormat}"</div>
                </div>
              }
              position="top"
              arrow={true}
              trigger="manual"
              open={this.isTooltipShown}
            >
              <input
                style={{
                  color: this.props.foregroundColor,
                  backgroundColor: this.props.backgroundColor,
                }}
                className={S.input}
                type="text"
                onBlur={this.handleInputBlur}
                onFocus={this.handleFocus}
                /*value={moment(this.props.value, this.props.inputFormat).format(
            this.props.outputFormat
          )}*/
                ref={this.refInput}
                value={this.textfieldValue}
                readOnly={this.props.isReadOnly}
                onChange={this.handleTextfieldChange}
                onClick={this.props.onClick}
                onDoubleClick={this.props.onDoubleClick}
                onKeyDown={this.handleKeyDown}
              />
            </Tooltip>
            {this.props.isInvalid && (
              <div className={S.notification}>
                <Tooltip html={this.props.invalidMessage} arrow={true}>
                  <i className="fas fa-exclamation-circle red" />
                </Tooltip>
              </div>
            )}
            {!this.props.isReadOnly && (
              <div
                className={S.dropdownSymbol}
                onMouseDown={() => setDropped(true)}
                ref={refTrigger}
              >
                <i className="far fa-calendar-alt" />
              </div>
            )}
          </div>
        )}
        content={() => (
          <div className={S.droppedPanelContainer}>
            <CalendarWidget
              onDayClick={this.handleDayClick}
              initialDisplayDate={this.momentValue?.isValid() ? this.momentValue : moment()}
              selectedDay={this.momentValue?.isValid() ? this.momentValue : moment()}
            />
          </div>
        )}
      />
    );
  }
}
