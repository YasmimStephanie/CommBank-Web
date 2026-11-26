import { faCalendarAlt, faSmile } from '@fortawesome/free-regular-svg-icons'
import { faDollarSign, IconDefinition } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { MaterialUiPickersDate } from '@material-ui/pickers/typings/date'
import 'date-fns'
import { BaseEmoji, Picker } from 'emoji-mart'
import 'emoji-mart/css/emoji-mart.css'
import React, { useEffect, useState } from 'react'
import styled from 'styled-components'
import { updateGoal as updateGoalApi } from '../../../api/lib'
import { Goal } from '../../../api/types'
import { selectGoalsMap, updateGoal as updateGoalRedux } from '../../../store/goalsSlice'
import { useAppDispatch, useAppSelector } from '../../../store/hooks'
import { selectMode } from '../../../store/themeSlice'
import DatePicker from '../../components/DatePicker'
import { Theme } from '../../components/Theme'

type Props = { goal: Goal }

export function GoalManager(props: Props) {
  const dispatch = useAppDispatch()

  const goal = useAppSelector(selectGoalsMap)[props.goal.id] ?? props.goal
  const mode = useAppSelector(selectMode)

  const [name, setName] = useState<string | null>(null)
  const [targetDate, setTargetDate] = useState<Date | null>(null)
  const [targetAmount, setTargetAmount] = useState<number | null>(null)
  const [icon, setIcon] = useState<string | null>(null)
  const [emojiPickerIsOpen, setEmojiPickerIsOpen] = useState(false)

  useEffect(() => {
    setName(goal.name)
    setTargetDate(goal.targetDate)
    setTargetAmount(goal.targetAmount)
    setIcon(goal.icon ?? null)
  }, [goal.id, goal.name, goal.targetDate, goal.targetAmount, goal.icon])

  useEffect(() => {
    setEmojiPickerIsOpen(false)
  }, [goal.id])

  const currentGoal = (): Goal => ({
    ...goal,
    name: name ?? goal.name,
    targetDate: targetDate ?? goal.targetDate,
    targetAmount: targetAmount ?? goal.targetAmount,
    icon: icon ?? goal.icon ?? null,
  })

  const updateNameOnChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextName = event.target.value

    setName(nextName)

    const updatedGoal: Goal = {
      ...currentGoal(),
      name: nextName,
    }

    dispatch(updateGoalRedux(updatedGoal))

    updateGoalApi(goal.id, updatedGoal)
  }

  const updateTargetAmountOnChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextTargetAmount = parseFloat(event.target.value)

    if (!Number.isFinite(nextTargetAmount)) return

    setTargetAmount(nextTargetAmount)

    const updatedGoal: Goal = {
      ...currentGoal(),
      targetAmount: nextTargetAmount,
    }

    dispatch(updateGoalRedux(updatedGoal))

    updateGoalApi(goal.id, updatedGoal)
  }

  const pickDateOnChange = (date: MaterialUiPickersDate) => {
    if (date != null) {
      setTargetDate(date)

      const updatedGoal: Goal = {
        ...currentGoal(),
        targetDate: date,
      }

      dispatch(updateGoalRedux(updatedGoal))

      updateGoalApi(goal.id, updatedGoal)
    }
  }

  const addIconOnClick = (event: React.MouseEvent) => {
    event.stopPropagation()

    setEmojiPickerIsOpen((open) => !open)
  }

  const pickEmojiOnClick = async (emoji: BaseEmoji, event: React.MouseEvent) => {
    event.stopPropagation()

    if (!emoji.native) return

    const updatedGoal: Goal = {
      ...currentGoal(),
      icon: emoji.native,
    }

    const success = await updateGoalApi(goal.id, updatedGoal)

    if (!success) {
      console.error('Failed to update goal icon')
      return
    }

    setIcon(emoji.native)
    setEmojiPickerIsOpen(false)
    dispatch(updateGoalRedux(updatedGoal))
  }

  const hasIcon = icon !== null && icon !== ''

  return (
    <GoalManagerContainer>
      {!hasIcon ? (
        <TransparentButton type="button" onClick={addIconOnClick} aria-expanded={emojiPickerIsOpen}>
          <FontAwesomeIcon icon={faSmile} size="2x" />

          <AddIconButtonText>Add icon</AddIconButtonText>
        </TransparentButton>
      ) : (
        <TransparentButton
          type="button"
          onClick={addIconOnClick}
          aria-label="Change goal icon"
          aria-expanded={emojiPickerIsOpen}
        >
          <GoalIcon>{icon}</GoalIcon>
        </TransparentButton>
      )}

      {emojiPickerIsOpen && (
        <EmojiPickerContainer hasIcon={hasIcon} onClick={(event) => event.stopPropagation()}>
          <Picker
            theme={mode}
            showPreview={false}
            showSkinTones={false}
            native
            onClick={pickEmojiOnClick}
          />
        </EmojiPickerContainer>
      )}

      <NameInput value={name ?? ''} onChange={updateNameOnChange} />

      <Group>
        <Field name="Target Date" icon={faCalendarAlt} />

        <Value>
          <DatePicker value={targetDate} onChange={pickDateOnChange} />
        </Value>
      </Group>

      <Group>
        <Field name="Target Amount" icon={faDollarSign} />

        <Value>
          <StringInput value={targetAmount ?? ''} onChange={updateTargetAmountOnChange} />
        </Value>
      </Group>

      <Group>
        <Field name="Balance" icon={faDollarSign} />

        <Value>
          <StringValue>{goal.balance}</StringValue>
        </Value>
      </Group>

      <Group>
        <Field name="Date Created" icon={faCalendarAlt} />

        <Value>
          <StringValue>{new Date(goal.created).toLocaleDateString()}</StringValue>
        </Value>
      </Group>
    </GoalManagerContainer>
  )
}

type FieldProps = {
  name: string
  icon: IconDefinition
}

const Field = (props: FieldProps) => (
  <FieldContainer>
    <FontAwesomeIcon icon={props.icon} size="2x" />

    <FieldName>{props.name}</FieldName>
  </FieldContainer>
)

const GoalManagerContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: flex-start;
  height: 100%;
  width: 100%;
  position: relative;
`

const TransparentButton = styled.button`
  display: flex;
  align-items: center;
  background: transparent;
  border: none;
  padding: 0;
  color: inherit;
  cursor: pointer;
`

const AddIconButtonText = styled.span`
  margin-left: 1rem;
  font-size: 1.4rem;
`

const GoalIcon = styled.span`
  font-size: 5.5rem;
  cursor: pointer;
`

const EmojiPickerContainer = styled.div<{
  hasIcon: boolean
}>`
  position: absolute;
  top: ${(props) => (props.hasIcon ? '10rem' : '2rem')};
  left: 0;
  z-index: 10;
`

const Group = styled.div`
  display: flex;
  flex-direction: row;
  width: 100%;
  margin-top: 1.25rem;
  margin-bottom: 1.25rem;
`

const NameInput = styled.input`
  display: flex;
  background-color: transparent;
  outline: none;
  border: none;
  font-size: 4rem;
  font-weight: bold;
  color: ${({ theme }: { theme: Theme }) => theme.text};
`

const FieldName = styled.h1`
  font-size: 1.8rem;
  margin-left: 1rem;
  color: rgba(174, 174, 174, 1);
  font-weight: normal;
`

const FieldContainer = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  width: 20rem;

  svg {
    color: rgba(174, 174, 174, 1);
  }
`

const StringValue = styled.h1`
  font-size: 1.8rem;
  font-weight: bold;
`

const StringInput = styled.input`
  display: flex;
  background-color: transparent;
  outline: none;
  border: none;
  font-size: 1.8rem;
  font-weight: bold;
  color: ${({ theme }: { theme: Theme }) => theme.text};
`

const Value = styled.div`
  margin-left: 2rem;
`
